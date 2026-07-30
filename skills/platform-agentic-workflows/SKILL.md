---
name: platform-agentic-workflows
version: 2.4.0
description: >
  Author GitHub Agentic Workflows (gh-aw) for PlainConcepts Platform repos, pushing every
  deterministic decision into GitHub Actions primitives and spending the agent only on
  judgement. Load when creating or reviewing a .github/workflows/*.md agentic workflow, when
  migrating a .loops/recipes/*.yaml recipe, when a workflow needs its Mermaid diagram, when
  choosing a trigger or a safe output, or when a compiled workflow misbehaves. Covers the
  determinism ladder, the verified frontmatter contract, the opencode engine on Forge, the
  full safe-output surface, trigger filters, and the Platform Mermaid scheme.
---

# Platform Agentic Workflows

A GitHub Agentic Workflow is a **markdown file whose body is the prompt**. The YAML
frontmatter is wiring: when it fires, where it runs, what it may read, what it may write.
Everything below the frontmatter is fed to the model as instructions.

Hold that sentence, because it is the source of every mistake in this format. A heading you
added for humans is an instruction. A Mermaid diagram at the bottom is an instruction.

## The thesis

Anyone can write an agentic workflow. Trigger on everything, grant broad permissions, and
write a paragraph asking the model to sort it out. It will appear to work, and it will be
slow, expensive, and non-reproducible, because a model was asked to do arithmetic that a
`gh` command answers exactly.

A good agentic workflow is mostly **not** agentic. It is a GitHub Actions workflow that has
an agent in the middle of it. Everything a script can decide, collect or validate, a script
does — before the agent starts, deterministically, for free. The agent is reserved for the
small part that genuinely needs judgement: reading the prepared code context, weighing risk,
writing prose, deciding what a human meant.

Treat model turns and input tokens as a constrained budget. Do not make the agent rediscover
event data, enumerate GitHub state, parse command output, or perform lifecycle bookkeeping.
Precompute the smallest useful context, give it a bounded task, and require one complete final
Safe Outputs payload. This is a correctness rule as well as a cost rule.

That principle has a mechanical form, and it is the core of this skill.

## Non-negotiable workflow design

Build workflows as short, named stages. Each stage has one responsibility, explicit inputs and
outputs, and can fail independently. Prefer a graph of small jobs and reusable local composite
actions over one large job or a long inline script.

- Put generic, deterministic operations in `.github/actions/<verb-noun>/action.yml`: selecting
  an event item, validating labels and state, loading comments, writing a context file, adding
  labels, removing labels, or posting a fixed comment.
- Keep domain policy in the workflow. Pass labels, markers, required state, bodies, paths and
  modes as action inputs. A local action must not embed a repository's workflow policy.
- A job that calls `./.github/actions/...` must run `actions/checkout` first. If checkout uses
  `github.token`, its job needs `contents: read`; `persist-credentials: false` is the default
  for lifecycle jobs that do not need git writes.
- Any action that writes an input path creates its parent directory first. Do not assume a
  temporary directory exists merely because its parent exists.
- Declare runtime permissions explicitly in tracked CI configuration. An unattended workflow
  cannot answer a tool permission prompt. Repository reads needed by the agent must be allowed;
  secrets and write tokens remain unavailable to the agent.
- Lifecycle labels describe state, not locking. Use `concurrency` for exclusivity. Reserve with
  one idempotent deterministic job before the agent, then release or transition labels on every
  terminal path.
- Make the lifecycle visible to people: a start marker, one complete question/outcome comment,
  and unambiguous labels. Keep a command label when an authorised reply must retrigger work;
  add a separate human-attention label such as `review` when a response is required. Every
  workflow that can stop for human input must add `review` via `add-labels` safe-outputs, and
  must include `review` in `remove-labels.allowed` so the next successful cycle can clear it.
  If `review` is missing from `remove-labels.allowed`, the bot silently fails to clean it up.
- Put a deterministic link to the current Actions run in every fixed lifecycle comment. Use
  `${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}` in the
  workflow-supplied comment body. The generic local comment action stays policy-free, and a
  person can open logs without searching Actions.
- Token usage is tracked automatically by gh-aw's AI Credits system (visible in the Actions
  run summary and in the `effective_tokens` output). Do not report tokens in issue comments.
- **Preload issue context on every workflow that implements, verifies, or gates work.** Use
  the reusable `load-issue-context` action to write the issue body, labels, and comment stream
  to `/tmp/gh-aw/agent/issue-context.json` before the agent starts. The agent reads the file
  and the prompt tells it that acceptance criteria there define what `/plan-goal` produces
  and what `/repo-verify` must pass. Without this, the agent cannot judge whether the work
  satisfies the issue.

For an issue refinement workflow, the normal shape is:

```text
label added or authorised reply
  → select and validate
  → reserve (`bot-working` + fixed start comment with run link)
  → preload issue context to /tmp/gh-aw/agent/issue-context.json
  → agent judgement (reads context, runs /plan-goal or /plan-story)
  → Safe Outputs
  → completed: remove `refine`, `review`, `bot-working`; add `refined`; post run link
  → questions: remove `bot-working`; keep `refine`; add `review`; post one question comment
  → blocked: remove `bot-working`; keep `refine`; add `review`; post blocking reason
  → incomplete: remove `bot-working`; keep `refine`; post one retry comment
```

For an implementation, merge-gate, or review-feedback workflow, the same lifecycle applies.
The issue context is always loaded so the agent can verify work against acceptance criteria.

The agent never performs this bookkeeping. It decides only whether it has enough information and
produces one complete final Safe Outputs payload.

## The determinism ladder

Every decision a workflow makes sits on one of seven rungs. **Push each decision to the
lowest rung that can hold it.** Lower is cheaper, faster, reproducible, and auditable.

```
RUNG                       COSTS          DECIDES                        PROMPT CAN READ IT
────                       ─────          ───────                        ──────────────────
0  Trigger                 nothing        Does this run at all?          n/a
1  Trigger filters         nothing        Is this event even ours?        n/a
2  Pre-activation steps    ~10s runner    Is there work? (gate only)      NO
3  Precompute steps        ~30s runner    What are the facts?             via /tmp/gh-aw/agent/
4  Custom jobs             a job          Which item? Facts + reservation YES
5  The agent               model tokens   Judgement                       n/a
6  Safe outputs            a job          Writing, validated              n/a
```

Mind the last column. Rung 2 gates but its outputs cannot reach the prompt; rung 4 both gates
and hands values over. Getting that backwards fails silently.

Rungs 0 to 2 can end a run without ever starting the model. Rung 6 is the only place an
**agent-directed** write belongs. A custom job may perform a small, idempotent lifecycle
reservation before the agent starts (for example, add `bot-working`); it must never make an
agent's judgement call or replace Safe Outputs for the agent's final changes. **A decision on
rung 5 that belonged on rung 2 is the defining error of this format.**

### Rung 0 — The trigger

Never poll, and never ask the agent whether there is work. The event *is* the answer.

### Rung 1 — Trigger filters

`names:`, `roles:`, `bots:`, `skip-bots:`, `skip-author-associations:`, `forks:`,
`skip-if-match:`, `skip-if-no-match:`. These are evaluated before a runner is claimed.

Writing `roles: [admin, maintainer, write]` replaces a whole paragraph of "check the comment
author is a collaborator", and it cannot be talked out of it by a comment body.

### Rung 2 — Pre-activation steps

`on.steps` with `on.permissions`, gated by `if: needs.pre_activation.outputs.<id>_result`.
A step with an `id` exposes `<id>_result` (`success` / `failure`). **If the answer is "no
work", the agent job is never created.**

```yaml
on:
  issues:
    types: [labeled]
    names: [implement]
  permissions:
    issues: read
  steps:
    - name: Is there anything to do at all?
      id: any
      env:
        GH_TOKEN: ${{ github.token }}
      run: |
        set -euo pipefail
        # ... exits non-zero when there is nothing

if: needs.pre_activation.outputs.any_result == 'success'
```

**Use this rung for a pure gate only.** Its `$GITHUB_OUTPUT` values land on the
`pre_activation` job, and the agent job does not depend on `pre_activation`. gh-aw will
happily interpolate `${{ needs.pre_activation.outputs.foo }}` into your prompt, and it
arrives **empty** — a silent failure, not a compile error. Anything the prompt needs to read
goes on rung 4.

### Rung 3 — Precompute steps

Top-level `steps:` run inside the agent job, after checkout, before the model. Write facts
to `/tmp/gh-aw/agent/`, which is handed to the agent and uploaded as an artifact.

```yaml
steps:
  - name: Collect the diff and the failing checks
    env:
      GH_TOKEN: ${{ github.token }}
    run: |
      set -euo pipefail
      mkdir -p /tmp/gh-aw/agent
      gh pr diff "$PR" > /tmp/gh-aw/agent/diff.patch
```

The agent reads a file instead of spending twenty tool calls gathering it.

### Rung 4 — Custom jobs

Top-level `jobs:`. **This is where selection lives whenever the prompt needs the answer**,
because the compiler adds custom jobs to the agent job's `needs`, so
`${{ needs.<job>.outputs.<name> }}` genuinely arrives — in the prompt and in rung-3 `steps:`.
Also the right rung when the facts need a different runner, a matrix, or other permissions.

Report "no work" as an output rather than a non-zero exit, and gate on it, so the run is
skipped rather than marked failed:

```yaml
jobs:
  pick:
    runs-on: ubuntu-latest
    permissions:
      issues: read
    outputs:
      found: ${{ steps.pick.outputs.found }}
      number: ${{ steps.pick.outputs.number }}
    steps:
      - id: pick
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          set -euo pipefail
          none() { echo "found=false" >> "$GITHUB_OUTPUT"; echo "$1"; exit 0; }
          # ... calls none "nothing eligible" when there is no work
          { echo "found=true"; echo "number=$number"; } >> "$GITHUB_OUTPUT"

if: needs.pick.outputs.found == 'true'
```

**A custom job has no checkout.** Pass `--repo "$REPO"` on every `gh issue`, `gh pr` and
`gh run` call, with `REPO: ${{ github.repository }}` in the job `env`. Without it `gh` tries
to infer the repository from a git remote that is not there and the job dies with
`fatal: not a git repository`. Rung-3 `steps:` run in the checked-out agent job and do not
have this problem, which is exactly what makes it easy to miss.

**A custom job is not gated by the trigger filters, so repeat the filter on the job.** This is
the sharp edge of rung 4. `names: [implement]` is a gh-aw construct compiled into the
*activation* job's condition, and GitHub Actions has no native label filter for
`issues: [labeled]` — so a run is created for **every** label added to any issue, and a custom
job with no `if:` runs on all of them.

The symptom: adding one unrelated label spawns a run of every label-triggered workflow, each
burning a runner before activation skips it. Mirror gh-aw's own condition:

```yaml
jobs:
  pick:
    if: >
      github.event_name != 'issues' || github.event.action != 'labeled' ||
      github.event.label.name == 'implement'
```

The run entry still appears in the Actions tab, greyed out with every job skipped. That is the
floor — only the runner cost can be removed, not the run. Yes, the label name is now written
twice; there is no way to reference `names:` from an `if:`, so mirror the three-part form
exactly and keep them adjacent.

The other trade-off against rung 2: a custom job runs in parallel with `pre_activation`, so it
is not gated by `roles:` either. `on.steps` runs inside `pre_activation`, after the role check,
but its outputs cannot reach the agent. Gate cheaply on rung 2; select on rung 4, guarded.

### Rung 5 — The agent

What only a model can do: read code and judge it, weigh merge risk, write a user story,
decide what a reviewer meant, fix a failing test.

What must never be here: counting, sorting, label arithmetic, "find the lowest-numbered
open issue", "check whether all referenced issues are closed", parsing JSON you could have
had `jq` parse on rung 3.

Keep its work deliberately narrow:

- Read the preloaded event context and only the repository files needed to form a judgement.
- Do not repeat deterministic checks that already selected, reserved, or supplied the item.
- Do not probe tools, install tooling, or inspect external GitHub state that a step could have
  supplied.
- End as soon as the judgement is formed with the complete allowed Safe Outputs payload; no
  progress comments, draft payloads, or exploratory output writes.

### Rung 6 — Safe outputs

The agent proposes; the framework writes, in a separate job, with validation, sanitisation
and an audit trail. **Never grant the agent a write permission to do by hand what a safe output
does.** Keep `permissions: read-all`; use Safe Outputs for all final writes. The only exception
is a deterministic, pre-agent custom-job reservation such as `bot-working`.

See `references/determinism.md` for worked before-and-after migrations of each rung.

## Your task

1. **Establish the trigger.** Decide whether the work reacts to a repository event or to a
   clock. *Done when:* a `schedule:` appears only where no event can express the trigger,
   and a comment says why.

2. **Walk the ladder.** For every decision the workflow makes, name its rung and push it as
   low as it goes. *Done when:* no numbered prompt step asks the model to count, sort,
   filter or select; every such decision has a `gh` command behind it on rung 1–4; and every
   value the prompt interpolates comes from a custom job, never from `pre_activation`.

3. **Preload issue context.** *Done when:* every workflow that implements, verifies, or gates
   work has a `load-issue-context` step writing to `/tmp/gh-aw/agent/issue-context.json`, and
   the prompt names the file and its acceptance criteria.

4. **Wire the frontmatter contract.** *Done when:* every row of the contract below is
   present, or absent with a comment saying why.

5. **Write the prompt body.** Numbered, sequential, imperative, second person. *Done when:*
   a reader can follow it without reading the YAML, and the last numbered step carries the
   `## Diagram` exclusion line verbatim.

6. **Render the diagram.** *Done when:* every check in `references/diagram.md` passes.

7. **Compile and verify.** *Done when:* `gh aw compile` reports zero errors, you have read
   every warning, and the generated job graph contains the jobs you intended.

8. **Test the shell before a run.** *Done when:* every rung-2/rung-4 script has been executed
   from a directory with no `.git`, and its `$GITHUB_OUTPUT` asserted. See
   `references/verify.md`.

## Compiling is not working

The lesson behind most of the traps in this skill: **a field can compile perfectly and still do
nothing.** There are three ways, and none of them produces an error.

| Failure | Example |
|---|---|
| Dropped by the engine | `tools:` under `engine: opencode` — one warning, whole block gone |
| Wired to a job that cannot see it | `needs.pre_activation.outputs.*` in the prompt — arrives empty |
| Not merged from an import | `permissions: read-all` in a shared file — no warning at all |

The published docs also run ahead of the installed compiler: `on.workflow_run.conclusion` is
documented and rejected by v0.83.4.

So for anything this skill does not explicitly confirm: **probe it, then grep the `.lock.yml` to
confirm it produced something.** Three minutes, and it is the difference between a workflow that
looks right and one that is. `references/verify.md` has the procedure.

## The frontmatter contract

Verified against gh-aw **v0.83.4**. Full field surface in `references/frontmatter.md`.

```yaml
---
description: |
  What this does, and which recipe or chain it replaces.

name: "Agent: Thing"        # REQUIRED. workflow_run matches this, not the filename.

on:                          # Rung 0-2. Event, filters, pre-activation steps.
  issues:
    types: [labeled]
    names: [implement]       # Rung 1: cheaper than checking in the prompt.

runs-on: ubuntu-latest       # Both keys, always. Omitting runs-on-slim silently
runs-on-slim: ubuntu-latest  # sends framework jobs to a GitHub-hosted ubuntu-slim.

engine:                      # Platform standard: opencode via Forge.
  id: opencode
  version: 1.1.58
  env:
    OPENAI_BASE_URL: https://forge.plainconcepts.com/v1

model: openai/glm-5-2        # The provider segment must be `openai`. See references/opencode.md.
secrets:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

max-turns: 30                 # Platform ceiling: enough to finish, low enough to stop loops.
max-turn-cache-misses: 100    # Forge has no prompt cache; every turn is a miss. Must be high.

network:                     # Explicit. Forge is not in `defaults`.
  allowed: [defaults, forge.plainconcepts.com]

permissions: read-all        # Read-only. Every write goes through safe-outputs.

safe-outputs:                # Rung 6.
  threat-detection: false     # Set on every agent workflow; imports do not own this policy.
  add-comment:

concurrency:                 # Wherever two runs must not overlap.
  group: thing
  cancel-in-progress: false

timeout-minutes: 30          # Always. Default is 20.
---
```

**`tools:` is silently ignored under `engine: opencode`.** The compiler warns once and drops
the whole block, `cache-memory` included. Do not write one, and never rely on a `bash:`
allowlist for safety here. This is the single biggest trap in the Platform setup;
`references/opencode.md` covers what to do instead.

### Shared components

The repeated parts live in `.github/workflows/shared/*.md` — a markdown file with **no `on:`**,
which the compiler validates but never compiles on its own:

```yaml
imports:
  - shared/platform-defaults.md   # network.allowed only
```

**Only some fields merge.** `network`, `safe-outputs`, `steps`, `pre-agent-steps`, `post-steps`,
`tools`, `env` and `checkout` do. `permissions`, `engine`, `model`, `runs-on`, `runs-on-slim` and
the `on:` filters do **not**, so every workflow keeps its own.

`permissions` is the trap worth memorising: `permissions: read-all` in a shared file compiles
with no warning and the agent job silently falls back to `contents: read`. Full verified table in
`references/frontmatter.md`.

## Events over schedules

A schedule is a fallback. An interval means latency up to the interval, and a run every
interval that usually finds nothing to do. Most of the state machinery in a polling loop
exists only because polling cannot see what changed.

| The work starts when | Trigger |
|---|---|
| A label is added | `issues: [labeled]` + `names: [thelabel]` |
| A label means "do it now, once" | `label_command:` — auto-removes the label |
| Someone replies on an issue | `issue_comment: [created]` |
| Someone reviews a PR | `pull_request_review_comment: [created]`, `pull_request_review: [submitted]` |
| A PR opens or updates | `pull_request: [opened, synchronize]` |
| A workflow finishes | `workflow_run: [completed]` + `branches: [main]` |
| A human asks | `slash_command:`, or `workflow_dispatch:` |
| Genuinely a clock | `schedule:` |

Two consequences worth planning for:

- **You do not need to detect who acted.** The event says so. Use `roles:` and
  `skip-author-associations:` on rung 1 rather than reading the comment stream on rung 5.
- **Exclusivity is `concurrency`, not a label.** A polling loop needs an in-progress label
  because several loops share one working tree. Actions gives you a real lock. Keep the
  label only if humans need to see the state.

Full surface, including every filter, in `references/triggers.md`.

## Migrating a recipe

| Recipe construct | Where it goes |
|---|---|
| `loops[].intervalHuman` | Delete. Find the event. `schedule:` only if truly clock-driven |
| Preflight (clean tree, sync main) | Delete. Every run is a fresh checkout |
| `sh` task that selects or locks | Rung 2, `on.steps` |
| `sh` task that gathers facts | Rung 3, `steps:` into `/tmp/gh-aw/agent/` |
| `sh` task that labels, comments, closes, merges | Rung 6, `safe-outputs:` |
| `opencode` task | The prompt body |
| `onSuccessTaskId` / `onFailureTaskId` | Numbered prompt steps; a separate workflow on `workflow_run` when it crosses a wait |
| `maxRuns` on an agent task | `max-turns:` |
| `maxRuns` on a verify task | A numbered "fix it and run it again" instruction |
| `exit 75` / nothing-to-do task | Delete. A run that should not happen does not happen |
| In-progress label used as a lock | `concurrency.group` |
| `{{output}}` passed between tasks | `/tmp/gh-aw/agent/*.json`, or `needs.<job>.outputs.*` |
| `{{opencode.tokens}}` / `{{opencode.cost}}` | A cost workflow on `workflow_run` |
| `silentChain: true` idle task | Delete |
| `diagram:` | The `## Diagram` section |

## The prompt body

The body is the **prompt**. Not a README, not a description of the workflow.

- Numbered, sequential, imperative, second person. One decision per step.
- State the stop conditions first. A workflow that should not act must stop before it
  labels, comments or writes anything.
- Name the facts already on disk: "Read `/tmp/gh-aw/agent/issue-context.json`", not "fetch the issue".
- Tell the agent that acceptance criteria in the issue context define what `/plan-goal` produces
  and what `/repo-verify` must pass. Without this, the agent cannot verify work against intent.
- Keep the prompt short. Do not restate event fields or facts already interpolated into it, and
  do not ask the model to verify deterministic work done by jobs.
- Require complete final Safe Outputs items. For example, one `add_comment` item contains the
  entire response, not a greeting followed by a second item with the questions.
- Say what not to do where the model would plausibly do it: do not weaken a test, do not
  merge, do not read outside the repository root.
- Where a fact came from rung 2–4, interpolate it: `${{ needs.pre_activation.outputs.pick }}`.
- The last numbered step is always, verbatim:

  > Ignore the `## Diagram` section below. It is documentation for humans and contains no
  > instructions for you.

Anything a human needs but the model does not goes in `description:`, which the compiler
keeps out of the prompt.

## The diagram

Every Platform workflow ends with a Mermaid flowchart under a final `## Diagram` heading,
sharing one visual language with `.loops/recipes/*.yaml`.

Node roles: `start` (white, exactly one), `decision` (orange), `action` (purple), `success`
(green terminal that writes), `failure` (red terminal), `idle` (dark grey no-op). Pass paths
are `-->|✓|`, fail paths are `-.->|✗|`, node IDs are camelCase and never `end`.

The six `classDef` lines must be copied verbatim from `references/diagram.md`. Do not retype
them from memory.

## Quality gates

All must pass before the workflow is committed.

**Determinism**
- [ ] No prompt step asks the model to count, sort, filter or select
- [ ] Every gate that can fail cheaply is on rung 1 or 2, not in the prompt
- [ ] Facts the agent needs are precomputed to `/tmp/gh-aw/agent/` where a `gh` command yields them
- [ ] Issue context is preloaded to `/tmp/gh-aw/agent/issue-context.json` on every workflow
      that implements, verifies, or gates work — the agent must not re-fetch the issue
- [ ] The prompt tells the agent to read the issue context and that its acceptance criteria
      define what `/plan-goal` produces and what `/repo-verify` must pass
- [ ] Every `${{ needs.*.outputs.* }}` in the prompt or in `steps:` names a **custom job**,
      never `pre_activation` — verify with `awk '/^  agent:/{f=1} f&&/needs:/{...}'` on the
      `.lock.yml` that the job appears in the agent's `needs`
- [ ] A selection job reports "no work" as an output and is gated with `if:`, so a quiet run
      is skipped rather than failed
- [ ] Every `gh issue` / `gh pr` / `gh run` call inside a custom job passes `--repo "$REPO"`
      — custom jobs are not checked out. Audit with:
      `awk '/^jobs:/{j=1} /^if:/{j=0} j' wf.md | grep -E 'gh (issue|pr|run) ' | grep -v -- --repo`
- [ ] Every custom job on a label-triggered workflow repeats the label filter in its own `if:`
      — `names:` only gates activation, so otherwise the job runs on *every* label added
- [ ] Any rung-2/rung-4 script was tested from a directory with no `.git`, not from a clone
- [ ] Every write goes through `safe-outputs`, none through granted write permissions
      (except an idempotent, pre-agent custom-job lifecycle reservation such as `bot-working`)
- [ ] Every workflow that can stop for human input has `review` in both `add-labels.allowed`
      and `remove-labels.allowed`
- [ ] Implement's `excluded-labels` includes `review` (a human is still working on the issue)
- [ ] No workflow uses `exclusive-label` for cross-workflow locking; use `concurrency` groups
      per workflow and `excluded-labels` per issue
- [ ] When the agent creates issues (e.g. audit), labels are applied by a `conclude` job, not
      by the AI's `create_issue` call

**Wiring**
- [ ] `name:` is set explicitly, and every `workflow_run.workflows` entry matches a real `name:`
- [ ] `on:` uses an event, or a comment states why a schedule was unavoidable
- [ ] `workflow_run` triggers carry `branches:`
- [ ] Both `runs-on` and `runs-on-slim` are set
- [ ] `engine.id` is `opencode`, `engine.version` is pinned, `OPENAI_BASE_URL` targets Forge,
      root `secrets.OPENAI_API_KEY` is mapped, and `model:` starts `openai/`
- [ ] `max-turns: 30` and `max-turn-cache-misses: 100` are explicitly set
- [ ] No `tools:` block (it is ignored under opencode)
- [ ] `network.allowed` lists `forge.plainconcepts.com`
- [ ] `permissions: read-all`
- [ ] Each `agent-*.md` declares `safe-outputs.threat-detection: false`; do not rely on a
      shared import. This avoids an additional model run.
- [ ] `timeout-minutes` is set, and generously enough for the slowest honest run
- [ ] A `concurrency` group exists wherever two runs must not overlap
- [ ] `push-to-pull-request-branch` with `target: "*"` also sets `checkout.fetch: ["*"]` and `fetch-depth: 0`

**Prose**
- [ ] The body is numbered and imperative, and stop conditions come first
- [ ] The prompt asks only for judgement and implementation; selection, GitHub reads, parsing,
      label lifecycle, and validation are deterministic steps or jobs
- [ ] Final Safe Outputs items are complete and bounded; label items use `item_number` and
      `labels`, never invented field names such as `label_names`
- [ ] The final numbered step contains the `## Diagram` exclusion line verbatim
- [ ] Human-only explanation lives in `description:`, not the body

**Diagram**
- [ ] It is the last section, under `## Diagram`
- [ ] Exactly one node of class `start`
- [ ] Every pass path is `-->|✓|`, every fail path is `-.->|✗|`
- [ ] All six `classDef` lines present verbatim, every node classified
- [ ] Node IDs are camelCase, none is `end`

**Verified**
- [ ] `gh aw compile` reports zero errors
- [ ] Every warning has been read and either fixed or consciously accepted
- [ ] The `.lock.yml` is committed alongside the `.md`

## Not-for boundaries

Do not use this skill for:

- **Ordinary CI.** A build-and-test workflow is plain YAML. A gate that sometimes reaches a
  different verdict is not a gate, so `app-*` workflows must never involve a model.
- **Public repositories on a self-hosted runner.** A fork PR would execute arbitrary code on
  the box holding the credentials. On GitHub-hosted runners a public repo is fine.
- **Writing `.loops/recipes/*.yaml`.** Load `loop-task-loops` and `loop-task-tasks`.

## References

Load these as needed; do not read all of them up front.

| File | Read it when |
|---|---|
| `references/determinism.md` | Moving work down the ladder. Worked before-and-after examples |
| `references/frontmatter.md` | Any frontmatter field: the verified surface, defaults, what we never use |
| `references/triggers.md` | Choosing a trigger, or filtering on rung 1 |
| `references/safe-outputs.md` | Choosing what the workflow may write |
| `references/opencode.md` | The engine, the Forge wiring, the `tools:` trap, cost telemetry |
| `references/patterns.md` | Shaping a workflow, or splitting one that does too much |
| `references/diagram.md` | Writing the `## Diagram` section. Contains the verbatim `classDef` lines |
| `references/verify.md` | Compiling, probing an unfamiliar field, or debugging a failed run |

## Cross-Skill References

- For the recipe schema this migrates away from, load **`loop-task-loops`** and
  **`loop-task-tasks`**.
- For the origin of the colour scheme and shape vocabulary, load **`loop-task-diagram`**.
  Both conventions must stay identical.
- For bringing a repository onto the Platform stack, load **`platform-onboard`** (Domain 5).
- For prose passes over generated issue bodies, load **`humanizer`**.
