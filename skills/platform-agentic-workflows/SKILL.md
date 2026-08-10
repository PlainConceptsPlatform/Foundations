---
name: platform-agentic-workflows
version: 4.6.0
description: >
  Author GitHub Agentic Workflows (gh-aw) for PlainConcepts Platform repos, pushing every
  deterministic decision into GitHub Actions primitives and spending the agent only on
  judgement. Load when creating or reviewing a .github/workflows/*.md agentic workflow, when
  adding or changing a route on the Work Router, when a workflow needs its Mermaid diagram,
  when choosing a trigger or a safe output, or when a compiled workflow misbehaves. Covers the
  router architecture, the determinism ladder, the verified frontmatter contract, the opencode
  engine on Forge, the safe-output surface, and the ways a workflow can be green and dead.
---

# Platform Agentic Workflows

A GitHub Agentic Workflow is a **markdown file whose body is the prompt**. The YAML
frontmatter is wiring: when it fires, where it runs, what it may read, what it may write.
Everything below the frontmatter is fed to the model as instructions.

That sentence is the source of every mistake in this format. A heading you added for humans
is an instruction. A Mermaid diagram at the bottom is an instruction.

## The thesis

Anyone can write an agentic workflow. Trigger on everything, grant broad permissions, and
write a paragraph asking the model to sort it out. It will appear to work, and it will be
slow, expensive, and non-reproducible, because a model was asked to do arithmetic that a
`gh` command answers exactly.

A good agentic workflow is mostly **not** agentic. It is a GitHub Actions workflow that has
an agent in the middle of it. Everything a script can decide, collect or validate, a script
does, before the agent starts, deterministically, for free. The agent is reserved for the
small part that genuinely needs judgement.

Treat model turns and input tokens as a constrained budget. Precompute the smallest useful
context, give it a bounded task, and require one complete final Safe Outputs payload.

## One router, many workers

The Platform shape is **one conventional workflow that owns every trigger**, and a set of
agentic workers that have no public trigger at all.

```
work-router.yml          conventional YAML. Every on: the repository has.
  └── classify           one event in, exactly one route out
        ├── call-refine        → agent-refine.lock.yml        workflow_call only
        ├── call-implement     → agent-implement.lock.yml     workflow_call only
        ├── call-apply-review  → agent-apply-review.lock.yml  workflow_call only
        ├── call-merge-gate    → agent-merge-gate.lock.yml    workflow_call only
        ├── call-audit         → agent-audit.lock.yml         workflow_call only
        └── deterministic jobs  bot-approve, audit-close, cleanup-artifacts,
                                stale-recovery, validate
```

Four things this buys, and they are the reason to accept the indirection:

1. **One route per event.** Before the router, adding a label started a run of every workflow
   subscribed to `issues: [labeled]`, each spinning up its own selection job before activation
   skipped it. Now one event creates one run, and at most one thing happens inside it.
2. **Concurrency has one owner.** Groups are keyed on the caller job. Workers declare none.
   Two layers would be two answers to the same question, and both would apply.
3. **Guards are testable.** Classification is a pure shell function with no network calls, so
   a test can source it. See `references/determinism.md`.
4. **Adding a route is one file.** The trigger, the guard, the concurrency key and the
   permissions all sit together.

What it does **not** buy: fewer runs. GitHub creates a run for every event that matches a
trigger. The router can decide nothing downstream happens, and those runs cost about ten
seconds with every job skipped, but the run entry still appears. To reduce the *count* you
have to stop generating events. See **App tokens fire events** below.

### The worker contract

A worker exposes `workflow_call` and nothing else. It declares its inputs, and the router
passes exactly those.

```yaml
on:
  workflow_call:
    inputs:
      issue-number:
        required: true
        type: string
```

Adding a public trigger to a worker bypasses the router and breaks the one-route-per-event
guarantee. If you need a manual entry point, add an operation to the router's
`workflow_dispatch`, not a trigger to the worker.

**The caller job must grant `permissions: write-all`.** This is not laziness and it is the
single most expensive thing to get wrong. See the trap table below.

## The determinism ladder

Every decision sits on one of seven rungs. **Push each decision to the lowest rung that can
hold it.** Lower is cheaper, faster, reproducible, and auditable.

```
RUNG                     LIVES IN   COSTS         DECIDES                   PROMPT CAN READ IT
────                     ────────   ─────         ───────                   ──────────────────
0  Trigger               router     nothing       Does anything run?        n/a
1  Route classification  router     ~10s runner   Which one thing runs?     n/a
2  Pre-activation steps  worker     ~10s runner   Is there work? gate only  NO
3  Precompute steps      worker     ~30s runner   What are the facts?       via /tmp/gh-aw/agent/
4  Custom jobs           worker     a job         Guard + reservation       YES, if in the if:
5  The agent             worker     model tokens  Judgement                 n/a
6  Safe outputs          worker     a job         Writing, validated        n/a
```

Two columns carry the traps. Rung 2 gates but its outputs cannot reach the prompt. Rung 4
both gates and hands values over, **but only if the guard appears in the dependent's `if:`**.

Rungs 0 and 1 can end a run without ever starting a model. Rung 6 is the only place an
**agent-directed** write belongs. A custom job may perform a small idempotent lifecycle
reservation before the agent starts (adding `bot-working`); it must never make an agent's
judgement call.

### Rung 0 and 1 live in the router

The router's `on:` block is the whole repository's trigger surface, and its classifier is a
pure function of the event payload: environment in, `key=value` out, no network.

gh-aw's own rung-1 filters (`names:`, `roles:`, `skip-bots:`, `skip-if-match:`) are compiled
into the *activation* job and evaluated against a triggering event. A `workflow_call` worker
has no triggering event, so those filters have nothing to filter. Their job moves to the
classifier, where it is ordinary shell and can be tested.

### Rung 2 and 3, inside the worker

`on.steps` gates. Top-level `steps:` precompute into `/tmp/gh-aw/agent/`, which is handed to
the agent and uploaded as an artifact. The agent reads a file instead of spending twenty tool
calls gathering it.

### Rung 4, custom jobs

Top-level `jobs:`. The compiler adds them to the agent job's `needs`, so
`${{ needs.<job>.outputs.<name> }}` genuinely arrives, in the prompt and in rung-3 `steps:`.

Report "no work" as an output rather than a non-zero exit, and **name that output in the
agent job's `if:`**. A `needs` job that succeeds with a false output does not stop anything.

A custom job has no checkout, so pass `--repo "$REPO"` on every `gh` call, and run
`actions/checkout` first if the job uses a local composite action.

### Rung 5, the agent

What only a model can do: read code and judge it, weigh merge risk, write a user story,
decide what a reviewer meant, fix a failing test.

What must never be here: counting, sorting, label arithmetic, "find the lowest-numbered open
issue", parsing JSON `jq` could have parsed on rung 3, or re-deriving a fact a job already
handed it.

### Rung 6, safe outputs

The agent proposes; a separate job writes, with validation and an audit trail. Keep
`permissions: read-all`.

Platform workers use two write paths, and the choice is about **attribution**:

- **`staged: true` plus apply it yourself.** The framework validates and stages, and the
  worker's own `conclude` job applies the items through `apply-agent-output` using a GitHub
  App installation token. Writes are attributed to the Platform App. Four of Numa's five
  workers do this.
- **Let the framework write.** `agent-implement` does, because `create-pull-request` packages
  the agent's commits as a git bundle and pushes them through GraphQL, which produces
  **signed** commits that satisfy a signed-commit ruleset. You cannot reproduce that yourself.

`references/safe-outputs.md` has both paths in full.

### Validate the outcome, then let the workflow own state

A Safe Outputs payload being syntactically valid does not make it a valid business outcome.
Validate the artifact after Safe Outputs and classify it deterministically, for example:

```text
nonblank update_issue body for source issue   -> complete
meaningful add_comment for source issue       -> questions
anything else                                 -> invalid
```

The classifier is a custom job whose output gates `conclude` and `incomplete`. A successful
agent run with an `invalid` outcome must go through incomplete handling, not write a partial
result.

Do not require the model to emit label actions as proof of completion. Labels are deterministic
state transitions. Disable agent label Safe Outputs for that worker, apply its body or comment,
then let ordinary workflow steps transition labels from the classifier result:

```text
complete  -> add refined + implement; remove refine + bot-working + review
questions -> add review; remove bot-working
invalid   -> existing incomplete path
```

This keeps the agent responsible for judgement and prose, while the workflow owns state.

When the apply action deliberately supplies a fallback target, outcome validation must mirror
that contract. An `update_issue` item may omit its target only when the caller deterministically
maps it to the source issue. Accept the source target or the documented fallback, but reject an
explicit target for another issue. Do not make a valid agent result fail because the validator
implements a narrower contract than the writer.

### Allow trusted App hand-offs explicitly

When a workflow-owned state transition triggers another agentic worker, GitHub sets the triggering
actor to the GitHub App. The default gh-aw activation requires a repository role, but an App has
none. The route can classify correctly and still skip every agent job.

Allow only the orchestrating App in that worker's own `on.bots` configuration:

```yaml
on:
  bots:
    - platform-devbox[bot]
  workflow_call:
    inputs:
      issue-number:
        required: true
        type: string
```

Keep human role checks unchanged. Do not weaken `on.roles` or allow all bots. Add a regression
check that the worker source retains the trusted App, compile its lock file, and inspect the
generated `GH_AW_ALLOWED_BOTS` value.

### Give implementation work a realistic deadline

Long-running implementation workers need a timeout that covers planning, parallel implementation,
verification, and PR creation. Set the worker's `timeout-minutes` explicitly rather than relying
on the default. Use 180 minutes for a broad, multi-layer change; do not extend a timeout merely to
hide a known stalled subagent.

## Ways a workflow is green and dead

This is the heart of the skill. **A field can compile perfectly, or a run can go green, and
still nothing happened.** Every row below cost a real debugging session.

| Symptom | Cause |
|---|---|
| Whole run has **zero jobs**, `startup_failure`, no annotation, no log | A caller job granted narrower `permissions` than a called worker's `read-all` requests |
| Every job green, agent emitted its output, **nothing was written** | `conclude` downloaded an artifact name that does not exist, and a `continue-on-error` swallowed the miss |
| Guard job says no, the agent runs anyway | The guard is in `needs` but not in the dependent's `if:` |
| A whole job vanished and nothing complained | It was indented one level too deep, so YAML absorbed it into the job above |
| `Unrecognized named-value: 'needs'`, job dies in one second | An `action.yml` used a context a composite action does not have, including inside `description:` |
| `Can't find action.yml` | A job used `./.github/actions/...` without `actions/checkout` first |
| Script exits 126 before its first line | No executable bit. A Windows checkout does not set one |
| `require is not defined in ES module scope` | A `.js` helper in a repo whose `package.json` is `"type": "module"`. Rename to `.cjs` |
| `tools:` block does nothing | Dropped entirely under `engine: opencode` |
| Prompt receives `issue #` with no number | `needs.pre_activation.outputs.*`. Not in the agent job's `needs`, resolves empty |
| A shared file's `permissions: read-all` has no effect | `permissions` does not merge from an import. No warning at all |
| The bot triggers itself in a loop | An App-token comment fires a workflow event |
| Merge gate approves on the wrong verdict | It re-derived CI from `gh pr checks`, whose first entry is an arbitrary check |
| The PR never closes its issue | `linkPullRequestToIssue` is not in GitHub's public schema |
| Merge gate never fires after CI | `workflow_run` does not fire for runs that were pending approval and then approved |
| Agent wrote a plausible body or comment, but the worker stopped incomplete | Outcome validation required model-authored label changes or did not classify the output |
| Router classified a trusted App label event, but every worker job skipped | The called worker did not list the App in `on.bots`, so activation rejected its role `none` |

The first row is the expensive one and it deserves its own paragraph.

### The caller permission trap

Every gh-aw agent job compiles to `permissions: read-all`, which requests **read on every
scope**. A caller job granting a tidy explicit map cannot satisfy that:

```yaml
permissions:          # looks like least privilege
  contents: read      # is a startup failure
  issues: write
  actions: write
```

GitHub rejects the reusable workflow call before creating any job. There is no annotation, no
log, and no entry in the jobs list. The run just shows `startup_failure`, and neither
actionlint nor `gh aw compile` sees it, because neither models permission satisfaction across
a `workflow_call` boundary.

There is no `read-all plus these writes` syntax, so the caller grants `write-all`:

```yaml
call-refine:
  uses: ./.github/workflows/agent-refine.lock.yml
  permissions: write-all
  secrets: inherit
```

This is safe because it is not the boundary that matters. The worker's own
`permissions: read-all` keeps the agent read-only, and `safe-outputs` with `allowed:` lists
enumerates every write. Record the reason next to the grant, or the next reader will tidy it
away and take the fleet down.

### The artifact name carries a prefix

gh-aw names the agent artifact `<prefix>agent`, and the prefix comes from
`compute_artifact_prefix.sh` reading `toJSON(inputs)`. A workflow triggered by an event has no
inputs, so the prefix is empty and the artifact is plainly `agent`. **The moment you convert
that workflow to `workflow_call`, every run gets a non-empty prefix.**

Anything downloading it by the bare name then finds nothing:

```yaml
- uses: actions/download-artifact@...
  with:
    name: ${{ needs.activation.outputs.artifact_prefix }}agent   # correct
    path: agent-artifact
```

The conclude job must therefore depend on `activation`, which is where that output lives.

This is the trap the router migration is most likely to spring, because converting a worker to
`workflow_call` looks purely structural. In Numa it silently disabled the write path of four
workers at once: the merge gate merged, pushed and closed nothing, apply-review pushed nothing,
refine changed no labels or bodies, and the audit filed no issues. Every run was green.

**Never wrap that download in `continue-on-error: true`.** That is what turns a wiring bug into
an invisible one: the miss is swallowed, the item count is zero, every apply step is skipped by
its `!= '0'` guard, and `conclude` reports success. A conclude job that applied nothing must
fail.

### A composite action manifest is not a document

The runner evaluates `${{ }}` **everywhere** in an `action.yml`, including inside
`description:`, and a composite action has no `needs`, `jobs` or `secrets` context. Writing a
caller's expression as documentation is enough to break it:

```yaml
inputs:
  artifact-name:
    description: Pass `${{ needs.activation.outputs.artifact_prefix }}agent`   # fails to load
```

The action fails at load time with `Unrecognized named-value: 'needs'` and the job dies in
about one second. Name the output in prose instead.

Nothing catches this by default: `gh aw compile` does not read composite action files and
actionlint does not lint them. A twenty-line script that parses every manifest and rejects
those three contexts closes the gap, and belongs in the same job as the other linters.

### A job indented one level too deep disappears

```yaml
  reserve:
    steps:
      - name: Claim the issue
        uses: ./.github/actions/add-issue-labels
    conclude:            # four spaces, not two
    needs: [agent]
```

YAML parses this without complaint, `conclude` becomes a key inside `reserve`, and the
workflow compiles with one fewer job. The merge gate lost its entire `conclude` job this way
and would simply never have merged anything. Assert the job list after compiling rather than
trusting a clean compile:

```bash
python -c "import yaml,sys; print(sorted(yaml.safe_load(open(sys.argv[1]))['jobs']))" x.lock.yml
```

### App tokens fire events

Writes made with `GITHUB_TOKEN` do not trigger workflows. Writes made with a **GitHub App
installation token do**. That single fact has two consequences:

**A loop hazard.** Any bot comment written with an App token fires an `issue_comment` event.
Guard the comment route on the sender: `github.event.comment.user.type != 'Bot'`.

**A run-count lever.** One human label normally produces two router runs: the label and the
bot's `bot-working` label. Meaningful bot outcome comments can add short no-op runs. Moving
bookkeeping writes to `GITHUB_TOKEN` removes their event runs entirely.

Do not blanket-switch. Writes that are meant to **advance the pipeline**, such as refine's
`conclude` adding `implement`, depend on the event firing. Split by intent:

| Write | Token | Why |
|---|---|---|
| `bot-working` and other bookkeeping writes | `GITHUB_TOKEN` | Bookkeeping. Nothing keys off it |
| `implement` added by refine's conclude | App token | The handoff needs the event |

## Design rules

Build workflows as short, named stages. Each stage has one responsibility, explicit inputs and
outputs, and can fail independently. Prefer a graph of small jobs and reusable local composite
actions over one large job or a long inline script.

The normal shape of a worker:

```text
router classifies the event
  → guard job (is there still work?)      output named in the agent job's if:
  → reserve (bot-working)
  → preload context to /tmp/gh-aw/agent/
  → agent judgement
  → Safe Outputs
  → conclude   (agent succeeded)
  → incomplete (agent did not)
```

### Composite actions

Put deterministic operations in `.github/actions/<verb-noun>/action.yml`. Pass labels,
markers, required state, bodies, paths and modes as inputs. A local action must not embed a
repository's workflow policy. The current taxonomy is in `references/determinism.md`.

Three rules that are not optional:

- **A job calling `./.github/actions/...` runs `actions/checkout` first.** Without it the
  action cannot be resolved and the job dies before its first step.
- **Invoke scripts as `bash path/to.sh`, not `path/to.sh`.** A checkout from a Windows clone
  carries no executable bit. Set the bit in the index as well
  (`git update-index --chmod=+x`), but do not depend on it.
- **One runtime per concern.** Anything that talks to the GitHub API uses
  `actions/github-script`, where a failed call rejects and fails the step. Anything that
  touches git uses shell. A `gh` plus `jq` loop that ends in `|| true` reports success it did
  not achieve.
- **No `needs`, `jobs` or `secrets` in a manifest**, not even inside `description:`. The
  runner evaluates every `${{ }}` in the file and a composite action has none of those
  contexts. Lint for it; nothing else does.

### Shared components (imports)

The repeated parts live in `.github/workflows/shared/*.md`, a markdown file with **no `on:`**,
which the compiler validates but never compiles on its own.

Only `network`, `safe-outputs`, `steps`, `pre-agent-steps`, `post-steps`, `tools`, `env` and
`checkout` merge. `permissions`, `engine`, `model`, `runs-on`, `runs-on-slim` and `on:` filters
do **not**. The verified table is in `references/frontmatter.md`.

`permissions` is the trap worth memorising: `permissions: read-all` in a shared file compiles
with no warning and the agent job silently falls back to `contents: read`.

Pin every version a shared setup file installs, and checksum anything it downloads. A run that
installs a different toolchain than the last one is not reproducible, and a failure caused by a
floating dependency reads as a model failure.

### Comment on outcomes, not on state a label already shows

The instinct is to narrate: "work has started", "the run finished". Both are noise. The label
already says the bot owns the issue, the Actions tab already says a run happened, and each
comment is another notification for everyone watching.

Worse, a bot comment written with an App token **fires a workflow event**, so a chatty
lifecycle also multiplies your run count.

| Comment | Keep |
|---|---|
| Clarification questions for the author | yes, it is the whole point of stopping |
| The refinement outcome | yes, it is the result |
| Feedback applied, or explicitly nothing actionable | yes |
| Failures and handoffs to a human | yes, with the reason |
| Risk assessment, merge or refusal | yes, the verdict is the value |
| Pull request link fallback | yes, it records a thing that is otherwise invisible |
| "Automated X has started" | no, the label says it |
| "Run finished, see previous comment" | no, it says nothing |

The test: would a human learn something they cannot see from the labels and the run list? If
not, delete it. Put a run link in the ones you keep:
`${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}`.

### Deferred automation must say so

Do not promise that a later worker will start when an eligibility label can defer it. Read labels
from the precomputed issue context and make the outcome conditional. For example, when a refined
issue retains `future`, say implementation is paused until that label is removed; otherwise say
the implement worker will start. The comment must describe the state the workflow actually leaves.

### Labels describe state, not locking

`concurrency` is the lock, on the router's caller job. Reserve with one idempotent
deterministic job before the agent, then release or transition labels on every terminal path.

**Contradictory labels must never coexist.** `bot-working` says the bot owns the issue right
now; `review` says a human is needed. An issue that stopped for a question and then got an
answer will carry both unless the claim clears the other:

```yaml
- name: Mark the issue as in progress
  uses: ./.github/actions/add-issue-labels
  with: { labels: "${{ env.WORKING_LABEL }}" }
- name: Clear the human-needed flag
  uses: ./.github/actions/remove-issue-labels
  with: { labels: "${{ env.REVIEW_LABEL }}" }
```

Both in the `reserve` job, so the claim is atomic. Do not leave it to the agent: it is a
deterministic consequence of claiming, not a judgement.

The same rule applies after the agent finishes. Derive terminal labels from a validated outcome,
not from `add_labels` or `remove_labels` items the model happened to return. A model can write a
good story and still omit one label instruction; that omission must never leave an issue half
refined.

### Naming runs

GitHub titles an issue-triggered run with the *issue* title, so every run on one issue reads
identically. Derive the title from the event instead:

```yaml
run-name: >-
  ${{ github.event_name == 'issues'
  && format('{0} label on #{1} by {2}', github.event.label.name, github.event.issue.number, github.actor)
  || github.event_name == 'issue_comment'
  && format('comment on #{0} by {1}', github.event.issue.number, github.actor)
  || github.event_name }}
```

Fold it to a single line. In a `>-` scalar, a continuation line indented further than the
first is preserved literally, newline and all. `run-name` is evaluated when the run is
created, before any job exists, so it can name the trigger but never the route.

## Events over schedules

A schedule is a fallback. An interval means latency up to the interval, and a run every
interval that usually finds nothing to do.

| The work starts when | Router trigger |
|---|---|
| A label is added | `issues: [labeled]` |
| Someone replies on an issue | `issue_comment: [created]` |
| Someone reviews a PR | `pull_request_review_comment`, `pull_request_review` |
| A bot opens a PR | `pull_request_target` |
| A workflow finishes | `workflow_run: [completed]` with `branches:` |
| A human asks | `workflow_dispatch:` with an `operation` input |
| Genuinely a clock | `schedule:` |

## The frontmatter contract

Verified against gh-aw **v0.83.4**. Full surface in `references/frontmatter.md`.

```yaml
---
description: |
  What this does. Human explanation belongs here, not in the body.

name: "Agent: Thing"        # REQUIRED. workflow_run matches this, not the filename.

on:
  workflow_call:             # Router-only worker. No public trigger.
    inputs:
      issue-number:
        required: true
        type: string

runs-on: ubuntu-latest       # Both keys, always. Omitting runs-on-slim silently
runs-on-slim: ubuntu-latest  # sends framework jobs to a GitHub-hosted ubuntu-slim.

secrets:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

engine:
  id: opencode
  version: "1.2.14"
  env:
    OPENAI_BASE_URL: https://forge.plainconcepts.com/v1

model: openai/glm-5-2        # Provider segment must be `openai`. See references/opencode.md.

max-turns: 300
max-turn-cache-misses: 3000  # Forge has no prompt cache; every turn is a miss.
max-ai-credits: 5000

env:
  GIT_AUTHOR_NAME: "github-actions[bot]"     # Without these, `git commit` inside the agent
  GIT_AUTHOR_EMAIL: "github-actions[bot]@users.noreply.github.com"
  GIT_COMMITTER_NAME: "github-actions[bot]"  # fails with "unable to auto-detect email".
  GIT_COMMITTER_EMAIL: "github-actions[bot]@users.noreply.github.com"

permissions: read-all        # Read-only. Every write goes through safe-outputs.

safe-outputs:
  staged: true               # Apply items yourself for App attribution. See safe-outputs.md.
  threat-detection: false    # Declare locally; imports do not own this policy.
  add-comment:

timeout-minutes: 30          # Always. Default is 20.
---
```

No `concurrency:`. The router owns it.

No `tools:` block. gh-aw drops the whole section under `engine: opencode`, `cache-memory`
included, with one warning and nothing in the lock file. A `bash:` allowlist here is dead
configuration that reads like a control.

## The prompt body

The body is the **prompt**. Not a README, not a description of the workflow.

- Numbered, sequential, imperative, second person. One decision per step.
- State the stop conditions first.
- Name the facts already on disk: "Read `/tmp/gh-aw/agent/issue-context.json`", not "fetch the
  issue".
- Do not restate facts already interpolated, and do not ask the model to verify deterministic
  work a job already did.
- Require complete final Safe Outputs items. One `add_comment` holds the whole response, not a
  greeting followed by the questions.
- Say what not to do where the model would plausibly do it: do not weaken a test, do not
  merge, do not read outside the repository root.
- Where a fact came from rung 1 to 4, interpolate it.
- The last numbered step is always, verbatim:

  > Ignore the `## Diagram` section below. It is documentation for humans and contains no
  > instructions for you.

Anything a human needs but the model does not goes in `description:`, which the compiler keeps
out of the prompt.

## The diagram

Every Platform workflow ends with a Mermaid flowchart under a final `## Diagram` heading.
Node roles: `start` (white, exactly one), `decision` (orange), `action` (purple), `success`
(green terminal that writes), `failure` (red terminal), `idle` (dark grey no-op). Pass paths
are `-->|✓|`, fail paths are `-.->|✗|`, node IDs are camelCase and never `end`.

Copy the six `classDef` lines verbatim from `references/diagram.md`.

## Your task

1. **Place the trigger on the router.** A new kind of work is a new route, not a new trigger.
   *Done when:* the classifier maps the event to exactly one route, the route has a job, and
   `verify-route-matrix.sh` asserts both.

2. **Walk the ladder.** *Done when:*
   - [ ] No prompt step asks the model to count, sort, filter, select, or re-derive a fact
   - [ ] Facts the agent needs are precomputed to `/tmp/gh-aw/agent/`
   - [ ] Every guard output is named in the `if:` of what it guards, not only in `needs`
   - [ ] Every `${{ needs.*.outputs.* }}` in the prompt names a custom job, never
         `pre_activation`
   - [ ] Every job using a local action runs `actions/checkout` first
   - [ ] Every write goes through `safe-outputs`, except an idempotent pre-agent reservation

3. **Wire the caller job.** *Done when:* `permissions: write-all`, the concurrency group is
   keyed on the thing that must not overlap, the inputs match the worker's declared inputs
   exactly, and a comment records why `write-all`.

4. **Write the prompt body.** *Done when:* a reader can follow it without the YAML, stop
   conditions come first, label items use `item_number` and `labels`, and the last step
   carries the `## Diagram` exclusion line verbatim.

5. **Render the diagram.** *Done when:* every check in `references/diagram.md` passes.

6. **Verify.** *Done when:* `gh aw compile --strict` reports zero errors, actionlint and
   shellcheck are clean, the route matrix passes, every composite manifest lints, the compiled
   job list is the one you intended, **and one real event has been observed end to end.** The
   static checks cannot see a startup failure. See `references/verify.md`.

## Not-for boundaries

- **Ordinary CI.** A build-and-test workflow is plain YAML. A gate that sometimes reaches a
  different verdict is not a gate, so `app-*` workflows must never involve a model.
- **Public repositories on a self-hosted runner.** A fork PR would execute arbitrary code on
  the box holding the credentials.

## References

Load these as needed; do not read all of them up front.

| File | Read it when |
|---|---|
| `references/determinism.md` | Moving work down the ladder, shaping a workflow, the router classifier and its test, the patterns, the composite action taxonomy |
| `references/frontmatter.md` | Any frontmatter field: the verified surface, triggers, filters, the merge table for imports, the worker contract, step ordering, known gaps |
| `references/safe-outputs.md` | What a workflow may write, staged versus framework writes, the App token pattern, the conclude/incomplete skeleton |
| `references/opencode.md` | The engine, the Forge wiring, the `tools:` trap, budgets, bot PRs, self-hosted runners |
| `references/diagram.md` | Writing the `## Diagram` section. Contains the verbatim `classDef` lines |
| `references/verify.md` | Compiling, linting, probing an unfamiliar field, debugging a failed run, what static checks cannot catch |

## Cross-Skill References

- For the origin of the colour scheme and shape vocabulary, load **`loop-task-diagram`**. Both
  conventions must stay identical.
- For bringing a repository onto the Platform stack, load **`platform-onboard`** (Domain 5).
- For prose passes over generated issue bodies, load **`humanizer`**.
