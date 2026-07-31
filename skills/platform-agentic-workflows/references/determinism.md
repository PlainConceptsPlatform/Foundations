# The determinism ladder, in practice

Verified against gh-aw **v0.83.4**.

The rungs are defined in `SKILL.md`. This file shows the work of moving a decision down one,
with the before-and-after for each. Every example is drawn from a real Numa recipe.

The test to apply, over and over: **could a shell command answer this exactly?** If yes, the
model must not be the one answering it.

---

## The two splitting rules

### Split on a wait

A workflow that waits is a workflow holding a runner for nothing. The recipe polled CI:

```yaml
- id: impl-await-ci
  commandArgs: ["-c", "for i in $(seq 1 20); do ... sleep 30; done"]
```

Ten minutes of a runner slot doing nothing, and a timeout branch to handle the case where CI
was merely slow. The workflow form is to stop at the PR and let CI's completion trigger the
next workflow:

```yaml
on:
  workflow_run:
    workflows: ["App: CI"]
    types: [completed]
    branches: [main]
```

The wait becomes free, the timeout branch disappears, and the conclusion arrives as a fact
instead of something to be parsed out of `gh pr checks` output.

### Split on a different trigger

If two chains in one recipe never touch each other, they were two workflows sharing an entry
point because polling only gives you one. `implement-loop.yaml` held three: implement,
CI-handling, and review-feedback. Each has its own event, so each becomes its own workflow and
the `impl-route` task that chose between them is deleted.

Do **not** split on a phase boundary within one trigger. An implement workflow that codes,
verifies and opens a PR is one workflow, because nothing external happens in between and
splitting it would mean handing state between runs for no reason.

---

## Rung 0 — The trigger

### Before: the recipe polls

```yaml
loops:
  - taskId: impl-preflight
    intervalHuman: 20m
```

Every twenty minutes, forever. Latency is up to twenty minutes, and the vast majority of runs
find nothing and exit. Because polling cannot see what changed, the recipe needs `impl-route`
to work out *why* it woke up, and `impl-nothing` to say it woke up for no reason.

### After: the event

```yaml
on:
  issues:
    types: [labeled]
    names: [implement]
```

Latency is seconds. `impl-route` and `impl-nothing` cease to exist, because a workflow that
is not triggered does not run. Two tasks and a state machine deleted by one trigger.

### What a schedule is still for

Work that no event signals. An audit looks for problems nobody has reported: there is no
"time to look for trouble" event, so `schedule:` is correct and the frontmatter should say so.

Prefer fuzzy schedules — `schedule: daily`, `schedule: daily around 14:00` — over raw cron.
The compiler scatters the exact minute, which stops every repository in the org from firing
simultaneously.

---

## Rung 1 — Trigger filters

Filters are evaluated before a runner is claimed. They cost nothing and cannot be argued
with by anything an attacker writes in a comment.

### Before: authorisation in the prompt

```
1. On an `issue_comment` event: continue only if the comment author is the issue author
   or an assignee, and the comment was not written by you.
```

That is a security control implemented as a polite request to a language model that reads the
untrusted comment in the same context window.

### After: the filter

```yaml
on:
  issue_comment:
    types: [created]
  roles: [admin, maintainer, write]
  skip-bots: true
```

Now the run does not start unless the actor has write access. The prompt keeps only what the
filter cannot express, such as "ignore an approval with no substantive body".

The full filter surface lives in `references/frontmatter.md`.

---

## Rungs 2 and 4 — Deterministic decisions before the agent

There are two places to run a shell command before the model starts, and choosing wrongly
fails silently. Settle this first.

| | Rung 2 — `on.steps` | Rung 4 — `jobs:` |
|---|---|---|
| Runs in | the `pre_activation` job | its own job |
| Ordering | after the `roles:` membership check | in parallel with `pre_activation` |
| Cost | a step on an existing slim job | one extra job |
| Gates the run | yes, via `<id>_result` | yes, via an output plus `if:` |
| **Prompt can read its outputs** | **no** | **yes** |

The last row is the whole decision. The compiler wires custom jobs into the agent job's
`needs`, so `${{ needs.<job>.outputs.x }}` resolves. It does **not** wire `pre_activation`
into the agent job, so `${{ needs.pre_activation.outputs.x }}` inside the prompt or inside a
rung-3 `steps:` block resolves to an empty string. gh-aw compiles it without complaint and
even generates an env var for it, so there is no error to notice — the agent simply receives
`issue #` with no number.

Verify it in the compiled output rather than trusting it:

```bash
awk '/^  agent:/{f=1} f&&/^    needs:/{g=1;next} g&&/^      - /{print $2; next} g{exit}' \
  .github/workflows/my-workflow.lock.yml
```

Every job whose outputs the prompt interpolates must appear in that list.

**The rule:** gate on rung 2, select on rung 4. If the decision produces a value anyone
downstream needs, it is a custom job.

### Before: the priority cascade as a prompt instruction

```
2. Choose the issue. Take the lowest-numbered open issue that carries `implement`,
   does not carry `bot-working`, and matches the first of these that yields anything:
   1. `priority` and `bug` and `implement`
   2. `priority` and `implement`
   3. `bug` and `implement`
   4. `implement`
```

The model is being asked to sort integers and evaluate set membership. It will usually get it
right. "Usually" is the problem: the ordering is a policy, and a policy that holds 95% of the
time is not one. And when nothing matches, the model has already been paid for.

### After: the cascade as the shell command it always was

The prompt needs the chosen number, so this is a custom job.

```yaml
jobs:
  pick:
    if: >
      github.event_name != 'issues' || github.event.action != 'labeled' ||
      github.event.label.name == 'implement'
    runs-on: ubuntu-latest
    permissions:
      issues: read
    outputs:
      found: ${{ steps.select.outputs.found }}
      number: ${{ steps.select.outputs.number }}
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: ./.github/actions/select-eligible-issue
        with:
          token: ${{ github.token }}
          candidate-label-groups: |
            priority,bug,implement
            priority,implement
            bug,implement
            implement
          excluded-labels: |
            bot-working
            review

if: needs.pick.outputs.found == 'true'
```

`excluded-labels` serves two purposes: `bot-working` prevents picking an issue that is
already in progress, and `review` prevents picking an issue that a human is still working on.

**Do not use `exclusive-label` for cross-workflow locking.** It blocks the entire pipeline
whenever any issue has the label — even if a refine running on issue A has nothing to do with
implement picking issue B. Per-workflow `concurrency` groups are the right serialization
mechanism. `excluded-labels` is the right per-issue guard.

The prompt now reads:

```
1. You are implementing issue #${{ needs.pick.outputs.number }}. It was selected for
   you; do not choose a different one.
```

The cascade is exact, it is reviewable in a diff, it costs about fifteen seconds, and on a
quiet day the agent job is never created.

### A custom job has no checkout

A custom job is a bare job: the compiler does not add `actions/checkout` to it. So `gh` has
no git remote to infer the repository from, and any command that relies on inference dies:

```
fatal: not a git repository (or any of the parent directories): .git
```

**Pass `--repo "$REPO"` on every `gh issue`, `gh pr` and `gh run` call in a custom job**, with
`REPO: ${{ github.repository }}` in the job's `env`. Rung-3 `steps:` do not have this problem:
they run in the agent job, which is checked out. That asymmetry is the trap — the same line
works in one block and fails in the other.

Testing this locally hides the bug, because your shell is usually sitting inside a clone.
Run the script from a directory with no `.git` to reproduce what the job sees:

```bash
mkdir -p /tmp/nogit && cd /tmp/nogit
GH_TOKEN=$(gh auth token) REPO=owner/repo GITHUB_OUTPUT=/tmp/nogit/out bash ./pick.sh
```

Audit an existing fleet for missing `--repo`:

```bash
for f in .github/workflows/agent-*.md; do
  awk '/^jobs:/{j=1} /^if:/{j=0} j' "$f" \
    | grep -E 'gh (issue|pr|run) ' | grep -v -- '--repo' | sed "s|^|$f: |"
done
```

### A custom job ignores the trigger filters

`names: [refine]` is a gh-aw construct compiled into the *activation* job's condition, and
GitHub Actions has no native label filter for `issues: [labeled]`. So a run is created for
**every** label added to any issue, and an unguarded custom job runs on all of them.

Observed: adding `refined` to an issue started a run of both the refine and the implement
workflow. Each `pick` job ran its full cascade on a fresh runner, then activation skipped
everything. Two runs and two runners for a label neither workflow cares about.

Mirror gh-aw's own three-part condition on the job:

```yaml
jobs:
  pick:
    if: >
      github.event_name != 'issues' || github.event.action != 'labeled' ||
      github.event.label.name == 'refine'
```

The run entry still appears, greyed out with every job skipped. The label name is now written
twice; there is no way to reference `names:` from an `if:`, so keep the two adjacent and
identical in form.

For a pure gate with nothing to hand downstream, `on.steps` is a step rather than a whole job.
Failing a pre-activation step **skips** the run rather than failing it, so a quiet day leaves
no red mark.

---

## Rung 3 — Precompute steps

Top-level `steps:` run **inside the agent job**, after checkout and before the model starts.
Anything written to `/tmp/gh-aw/agent/` is visible to the agent and uploaded as an artifact.

### Before: the agent gathers its own context

```
2. Read the issue and every comment on it.
3. Read the diff in full.
4. Read the failing job's logs.
```

Three vague instructions, each costing several tool round-trips, each returning whatever the
model decided to ask for, none of it reproducible or visible after the fact.

### After: the facts are on disk before the model wakes up

```yaml
steps:
  - name: Load the issue context
    uses: ./.github/actions/load-issue-context
    with:
      token: ${{ github.token }}
      issue-number: ${{ needs.pick.outputs.number }}
      output-path: ${{ env.ISSUE_CONTEXT_PATH }}
  - name: Collect the review context
    env:
      GH_TOKEN: ${{ github.token }}
      PR: ${{ github.event.pull_request.number }}
    run: |
      set -euo pipefail
      mkdir -p /tmp/gh-aw/agent
      gh pr diff "$PR" > /tmp/gh-aw/agent/diff.patch
      gh pr view "$PR" --json title,body,files,review-comments \
        > /tmp/gh-aw/agent/pr.json
```

```
2. Read `${{ env.ISSUE_CONTEXT_PATH }}`. It contains the issue body, labels, and full
   comment stream. Its acceptance criteria define what `/plan-goal` produces and what
   `/repo-verify` must pass.
3. Read `/tmp/gh-aw/agent/pr.json` and `/tmp/gh-aw/agent/diff.patch`.
```

Same information, one deterministic fetch, and the artifact survives the run so a human can
see exactly what the model was looking at when it decided.

The issue context step is not optional for implementation, merge-gate, or review-feedback
workflows. The agent cannot verify work against acceptance criteria it has never read.

### When to precompute

Precompute when the fetch is predictable: you know before the run which objects you need.
Leave it to the agent when the next fetch depends on what the last one said — following a
reference chain, or reading whichever source file the diff turns out to touch.

---

## Rung 5 — The agent

Reserve it for judgement. A useful split:

| Belongs to the agent | Never the agent's job |
|---|---|
| Reading code and deciding whether it is correct | Counting, sorting, set membership |
| Weighing merge risk across a diff | "Find the lowest-numbered open issue" |
| Writing a user story, or prose a human will read | "Check whether all referenced issues are closed" |
| Interpreting what a reviewer meant | Parsing JSON that `jq` could parse |
| Fixing a failing test | Deciding whether the actor has write access |
| Deciding whether a finding is worth filing | Detecting which event fired |

`max-turns: 300` bounds the agent's tool loop. Set it where an honest run finishes comfortably
and a confused one stops.

---

## Rung 6 — Safe outputs

The agent never writes. It emits structured requests, and a separate job with the necessary
permissions validates and applies them. See `references/safe-outputs.md` for the full surface,
the conclude/incomplete skeleton, and the GitHub App token pattern.

Write the prompt in the language of proposal — "propose closing", "propose a pull request" —
because that is what the mechanism does, and it stops the model from hunting for a `gh`
command it does not have.

---

## Patterns we use

### IssueOps

Issue events drive the work; safe outputs write back. This is the backbone of the Numa fleet:
`agent-refine`, `agent-implement`.

Sub-issue hierarchies come free with `create-issue`:

```yaml
safe-outputs:
  create-issue:
    max: 6
    group: true
```

### DeterministicOps

The pattern behind the whole ladder: precompute with real steps, reason with the agent,
post-process deterministically.

```
steps: (gh CLI → /tmp/gh-aw/agent/)  →  agent reads files  →  safe-outputs write
```

### MonitorOps

A workflow triggered by another workflow's completion. `agent-merge-gate` (CI finished) is
this pattern.

Do not use a separate MonitorOps workflow for cost reporting. Token usage is tracked
automatically by gh-aw's AI Credits system.

The trap is the `name:` match, and it is silent. `workflows: ["App: CI"]` must equal the
target's `name:` exactly.

### LabelOps

Labels as both command and state. Use `label_command` when the label is a button — applying
it again should run it again. Use `names:` filtering when the label describes the issue and
other things read it. `implement` is state; `reaudit` would be a command.

### LifecycleOps

Use this shape when a human can answer an agent's questions and resume the same work. Split the
work into small deterministic stages and make each reusable across workflows:

```text
trigger → select/validate → reserve → preload issue context + facts → agent → Safe Outputs → terminal state
```

`select/validate`, `reserve`, issue context loading, and fixed lifecycle comments are
deterministic. Implement them as parameterised local composite actions, not prompt
instructions or copied shell fragments.

**Issue context is mandatory** on every workflow that implements, verifies, or gates work.
Load it with the `load-issue-context` action to `/tmp/gh-aw/agent/issue-context.json`. The
prompt must tell the agent to read it and that its acceptance criteria define what
`/plan-goal` produces and what `/repo-verify` must pass.

Every fixed lifecycle comment should link to its run. For an issue waiting on an answer, keep
its command label (`refine`) so an authorised comment can trigger the response pass. Add a
separate state label (`review`) to tell people input is needed. Remove the working label
before asking questions. On successful completion remove all transient labels including
`review` and add the terminal label (`refined`). `concurrency`, not `bot-working`, is the
lock.

`review` must be in both `add-labels.allowed` and `remove-labels.allowed` on every workflow
that can stop for human input. Implement's picker must exclude issues with `review`; refine
must **not** exclude `review` — a refine issue with `review` is waiting for the author's
reply, and the rerefine pass clears it on completion.

The full conclude/incomplete job skeleton is in `references/safe-outputs.md`.

### ChatOps

`slash_command` for anything a human asks for on demand. Access defaults to write-permission
users.

### DispatchOps

`workflow_dispatch` with typed inputs, for research and operational tasks with no natural
trigger. Every Platform workflow should carry `workflow_dispatch:` alongside its real trigger
regardless, so it can be run by hand while it is new.

---

## Patterns we deliberately do not use

**WorkQueueOps** — a durable queue drained N items per run. GitHub labels already are our
queue, and events already tell us when an item joins it. Reach for this only when the backlog
genuinely exceeds what a run can process. The cache-memory variant does not work under opencode.

**BatchOps** — matrix fan-out with deterministic sharding. Right for 50+ independent items. Our
volumes do not reach it.

**OrchestratorOps** — an orchestrator dispatching workers via `dispatch-workflow` or
`call-workflow`. Worth knowing for a future multi-repo rollout. For a single repository,
`workflow_run` chaining is simpler.

**MemoryOps** — `cache-memory` / `repo-memory`. Both are dropped under opencode. Store state
where GitHub already stores it: a label, a comment, an issue body.

**ResearchPlanAssignOps** — research posts a discussion, `/plan` turns it into sub-issues,
issues get assigned to Copilot. Our audit workflow is the research phase without the
discussion step.

**CorrectionOps** — store what the workflow predicted, compare against what humans later
decided, feed the difference back. Experimental.

---

## The composite action taxonomy

Implement deterministic stages as reusable local composite actions in
`.github/actions/<verb-noun>/action.yml`. A local action must not embed a repository's
workflow policy — pass labels, markers, required state, bodies, paths and modes as action
inputs.

| Action | Responsibility |
|---|---|
| `select-triggering-issue` | Read issue number from event payload |
| `select-eligible-issue` | Priority-cascade selection with ordered label groups, excluded labels, and skip-if-open-pr |
| `validate-issue` | Check required/blocked labels; write issue JSON to disk |
| `identify-gate-subject` | Find bot-authored PR, its closing issue, and CI verdict from workflow_run or dispatch |
| `load-issue-context` | Write issue body, labels, and full comment stream to JSON (mandatory for implement/gate/review) |
| `load-issue-comments` | Write comment stream to JSON |
| `classify-issue-conversation` | Distinguish initial pass vs authorised response after a marked workflow comment |
| `add-issue-labels` | Add one or more labels |
| `remove-issue-labels` | Remove one or more labels (ignores 404) |
| `create-issue-comment` | Post a complete Markdown comment |
| `download-agent-output` | Download the agent artifact; expose output JSON, bundle file, and item count |
| `update-agent-issues` | Read `update_issue` items from agent_output.json and apply each |
| `apply-agent-comments` | Read `add_comment` items and post each |
| `apply-agent-labels` | Read `add_labels` / `remove_labels` items and apply each |
| `create-agent-pr` | Read `create_pull_request` from agent output, apply git bundle, push, open PR |
| `merge-agent-pr` | Read `merge_pull_request` and merge via `gh pr merge --squash` |
| `push-agent-branch` | Read `push_to_pull_request_branch`, apply git bundle, push to PR branch |
| `create-agent-issues` | Read `create_issue` items and create each via `gh issue create` |
| `link-agent-sub-issues` | Read `link_sub_issue` items and link via GraphQL |
| `close-agent-issues` | Read `close_issue` items and close each with the appropriate reason |

A job that calls `./.github/actions/...` must run `actions/checkout` first. If checkout uses
`github.token`, its job needs `contents: read`; `persist-credentials: false` is the default for
lifecycle jobs that do not need git writes.

Any action that writes an input path creates its parent directory first.

---

## The Numa fleet as shapes

| Workflow | Shape | Trigger | Rung-4 work |
|---|---|---|---|
| `agent-refine` | IssueOps + LifecycleOps | `refine` label, or an author comment | Validate + classify conversation |
| `agent-implement` | IssueOps + DeterministicOps | `implement` label, or the gate finishing | Priority cascade + issue context |
| `agent-merge-gate` | MonitorOps | CI completing | Identify the PR and its issue + issue context |
| `agent-apply-review` | IssueOps | A review comment or submitted review | Confirm ownership + issue context |
| `agent-audit` | DeterministicOps | Schedule | `skip-if-match` backpressure |
| `agentics-audit-close` | DeterministicOps (no agent) | Schedule | Resolve every report's references |

---

## When to convert an agentic workflow to plain YAML

Strike out every prompt step that a shell command could do exactly. If what remains would not
be worth a model call on its own, the workflow is a script.

Two examples from Numa:

- **`agentics-audit-close.yml`** was almost entirely rung-5 work: list reports, extract `#NNN`
  references, check each one's state, decide. All four steps are shell commands. Moving them to
  rung 2 leaves the agent with nothing to judge. It went from 240 to about 80 lines.
- **`agentics-cost.yml`** was deleted entirely. Token usage is tracked by the AI Credits
  system automatically.

What you gain: no tokens, no `threat-detection` job, no engine setup, exactly reproducible
output, and a file a fifth of the size.

What you give up: prose a human will read. That is a fair trade for a maintenance sweep and a
bad one for anything a person is meant to engage with.

When you convert:

- **The determinism is not new.** These scripts are the rung-2/rung-4 jobs, lifted out.
- **Naming.** A converted workflow is no longer `agent-*`. It becomes `agentics-*`, the prefix
  for tooling that serves the agent fleet without being part of it.
- A deterministic workflow with `issues: write` is **safer** than the agentic one it replaces:
  there is no prompt, so there is no prompt injection surface.

---

## The whole ladder on one workflow

`implement-loop.yaml` held 22 tasks. Placed on the ladder:

| Rung | What lands there | Recipe tasks absorbed |
|---|---|---|
| 0 | `issues: [labeled]` + `workflow_run` from the gate | `intervalHuman`, `impl-route`, `impl-nothing` |
| 1 | `names: [implement]` | The label check |
| 2 | Nothing: the selection has a value to hand over, so it cannot live here | — |
| 3 | The issue and its comments, fetched to `/tmp/gh-aw/agent/` | Part of `impl-implement` |
| 4 | The priority cascade and the in-flight check | `impl-route`'s selection |
| 5 | Implement, verify, fix | `impl-implement`, `impl-verify`, `impl-fix` |
| 6 | PR, comment, labels | `impl-commit`, `impl-pr` |
| — | Split to another workflow on `workflow_run` | `impl-await-ci`, `impl-ci-*`, `impl-merge-pr`, `impl-complete` |
| — | Deleted: fresh checkout every run | `impl-preflight`, `impl-clean-dirty` |

Twenty-two tasks become one workflow of nine prompt steps plus one pre-activation script, and
a second workflow that CI wakes. Nothing was lost. The polling scaffolding went away because
the thing it compensated for went away.
