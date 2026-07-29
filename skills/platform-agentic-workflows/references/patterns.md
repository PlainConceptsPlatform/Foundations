# Workflow shapes

Verified against gh-aw **v0.83.4**.

gh-aw documents sixteen design patterns. This file records which ones Platform uses, how they
map onto our workflows, and the two rules that decide how a chain gets split.

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

```json
{"type": "create_issue", "temporary_id": "aw_x", "title": "Audit report"}
{"type": "create_issue", "parent": "aw_x", "title": "Finding 1"}
```

### DeterministicOps

The pattern behind the whole ladder: precompute with real steps, reason with the agent,
post-process deterministically. `references/determinism.md` is this pattern in full.

The three-stage shape:

```
steps: (gh CLI → /tmp/gh-aw/agent/)  →  agent reads files  →  safe-outputs write
```

### MonitorOps

A workflow triggered by another workflow's completion. `agent-merge-gate` (CI finished) and
`agent-report-cost` (any agent run finished) are both this.

The trap is the `name:` match, and it is silent. `workflows: ["App: CI"]` must equal the
target's `name:` exactly.

### LabelOps

Labels as both command and state. See `references/triggers.md` for `label_command` versus
`names:` filtering. The rule: a label that a later workflow reads is state; a label that means
"go" and should be re-appliable is a command.

### ChatOps

`slash_command` for anything a human asks for on demand. Access defaults to write-permission
users, which is usually what you want.

### DispatchOps

`workflow_dispatch` with typed inputs, for research and operational tasks with no natural
trigger. Every Platform workflow should carry `workflow_dispatch:` alongside its real trigger
regardless, so it can be run by hand while it is new.

---

## Patterns we deliberately do not use

**WorkQueueOps** — a durable queue drained N items per run, backed by an issue checklist,
sub-issues, cache-memory or a discussion. GitHub labels already are our queue, and events
already tell us when an item joins it. Reach for this only when the backlog genuinely exceeds
what a run can process and items must survive interruption. Note that the cache-memory variant
does not work under `engine: opencode` (`references/opencode.md`).

**BatchOps** — matrix fan-out with deterministic sharding, `(item % shards) == index`, and
`fail-fast: false`. Right for 50+ independent items. Our volumes do not reach it.

**OrchestratorOps** — an orchestrator dispatching workers via `dispatch-workflow` (async) or
`call-workflow` (sync, preserves actor attribution). Worth knowing for a future multi-repo
rollout. For a single repository, `workflow_run` chaining is simpler and has fewer moving parts.

**MemoryOps** — `cache-memory` for session state, `repo-memory` for history on a git branch.
Both are dropped under opencode. Where a workflow needs to remember something, store it where
GitHub already stores state: a label, a comment, an issue body. That is visible to humans,
which cache-memory is not.

**ResearchPlanAssignOps** — research posts a discussion, `/plan` turns it into sub-issues,
issues get assigned to Copilot, a human merges. Our audit workflow is the research phase of
this without the discussion step: it files issues directly, because `implement` already routes
them to an agent.

**CorrectionOps** — store what the workflow predicted, compare against what humans later
decided, and feed the difference back into the instructions. Experimental. Worth revisiting
once the fleet has enough history to compare against.

---

## The Numa fleet as shapes

| Workflow | Shape | Trigger | Rung-2 work |
|---|---|---|---|
| `agent-refine` | IssueOps | `refine` label, or an author comment | Priority cascade |
| `agent-implement` | IssueOps + DeterministicOps | `implement` label, or the gate finishing | Cascade + in-flight check |
| `agent-merge-gate` | MonitorOps | CI completing | Identify the PR and its issue |
| `agent-apply-review` | IssueOps | A review comment or submitted review | Confirm ownership |
| `agent-audit` | DeterministicOps | Schedule | `skip-if-match` on an open report |
| `agent-audit-close` | DeterministicOps | Schedule | Resolve every report's references |
| `agent-report-cost` | MonitorOps | Any agent workflow completing | Locate the run and its target |

Two of these are worth studying as examples of the ladder paying off.

**`agent-audit-close`** was almost entirely rung-5 work: list reports, extract `#NNN`
references, check each one's state, decide. All four steps are shell commands. Moving them to
rung 2 leaves the agent with nothing to judge, which is the signal that this workflow barely
needs an agent at all — and on a day when nothing is closeable, it does not run.

**`agent-report-cost`** has no judgement in it whatsoever. Download an artifact, parse JSONL,
multiply by a price table, format a comment. Every part of that is deterministic, and the only
reason it is an agentic workflow is that the artifact may be absent and the target must be
inferred. Push the arithmetic to rung 3 and the agent's job shrinks to writing one comment.

When a workflow's honest rung-5 content approaches zero, **do not write an agentic workflow at
all.** Saying so in the `description:` is not enough; that was the mistake this section used to
recommend.

Both of the examples above were rewritten as plain YAML Actions workflows. The test to apply:

> Strike out every prompt step that a shell command could do exactly. If what remains would
> not be worth a model call on its own, the workflow is a script.

What you gain: no tokens, no `threat-detection` job, no engine setup, exactly reproducible
output, and a file a fifth of the size. `agentics-cost.yml` went from 265 lines to about 60,
`agentics-audit-close.yml` from 240 to about 80.

What you give up, and when it matters: prose a human will read. `agentics-audit-close.yml`
templates its closure comment instead of composing one. That is a fair trade for a maintenance
sweep and a bad one for anything a person is meant to engage with.

Two things to keep when you convert:

- **The determinism is not new.** These scripts are the rung-2/rung-4 jobs, lifted out. If the
  agentic version had no such job, converting it is a rewrite rather than a lift, and the
  ladder work comes first.
- **Naming.** A converted workflow is no longer `agent-*`. Ours become `agentics-*`, the prefix
  for tooling that serves the agent fleet without being part of it.

Also worth stating plainly: a deterministic workflow with `issues: write` is **safer** than the
agentic one it replaces, not riskier. There is no prompt, so there is no prompt injection
surface, and safe outputs exist to solve a problem it no longer has.
