# Frontmatter reference

Verified against gh-aw **v0.83.4**. Where the published docs and the installed compiler
disagree, the compiler wins and the disagreement is noted.

Fields are grouped by what they decide. Anything marked **Platform** is part of the contract
in `SKILL.md`; anything marked *avoid* has a reason attached.

---

## Identity

| Field | Notes |
|---|---|
| `name:` | **Platform: required.** The display name in Actions, and the string `workflow_run.workflows` matches. Not the filename |
| `description:` | **Platform: required.** Free prose, compiled into a comment in the `.lock.yml`. Kept out of the prompt, so this is where the human explanation belongs |
| `emoji:` | Cosmetic |
| `labels:` | Categorises the workflow itself for `gh aw list --label`. Not issue labels |
| `source:` | `owner/repo/path@ref`. Set by `gh aw add`; enables `gh aw update` |
| `tracker-id:` | Min 8 chars. Tags every asset the workflow creates so they can be found later |
| `metadata:` | Arbitrary key-value pairs |

---

## When it fires

The trigger is rung 0 and the filters are rung 1. Together they decide whether a run happens
at all, and they do it before a runner is claimed. Work spent here is free; the same decision
made in the prompt costs a model call and can be argued with.

### Choosing the trigger

| The work starts when | Trigger |
|---|---|
| A label is added | `issues: [labeled]` with `names:` |
| A label means "do this once, now" | `label_command:` |
| An issue is opened | `issues: [opened]` |
| Someone comments on an issue | `issue_comment: [created]` |
| Someone comments on a PR's code | `pull_request_review_comment: [created]` |
| Someone submits a review | `pull_request_review: [submitted]` |
| A PR opens or gets new commits | `pull_request: [opened, synchronize]` |
| A PR merges | `pull_request: [closed]` + `if:` on `merged` |
| A workflow finishes | `workflow_run: [completed]` |
| A human types a command | `slash_command:` |
| A human clicks a button | `workflow_dispatch:` |
| An external system says so | `repository_dispatch:` |
| A release is published | `release: [published]` |
| A deployment fails | `deployment_status:` with `state: [error, failure]` |
| Genuinely a clock | `schedule:` |

### `label_command` versus `issues: [labeled]`

```yaml
on:
  label_command: reaudit      # a command: fires, then removes the label
```

```yaml
on:
  issues:
    types: [labeled]
    names: [implement]        # a state: the label persists as metadata
```

Use `label_command` when the label is a button — applying it again should run it again. Use
`names:` filtering when the label describes the issue and other things read it. `implement`
is state, because the merge gate later removes it to mean "done".

The matched label is available as `${{ needs.activation.outputs.label_command }}`.

### `schedule`

Prefer fuzzy syntax over cron. The compiler scatters the exact minute so that many
repositories do not fire at once:

```yaml
on:
  schedule: daily
  schedule: daily around 14:00
  schedule: daily between 9:00 and 17:00
  schedule: weekly on friday around 5pm
  schedule: hourly
```

Raw cron still works (`- cron: "17 1,13 * *"`) and is right when the time genuinely matters.
Any scheduled workflow should carry `skip-if-no-match` so that a quiet day costs nothing.

### `workflow_run`

The chaining trigger, and the one with the sharpest edge: **`workflows:` matches the workflow
`name:`, not the filename.** A reference to `agent-merge-gate` when the workflow is named
`Agent: Merge Gate` silently never fires.

```yaml
on:
  workflow_run:
    workflows: ["App: CI"]
    types: [completed]
    branches: [main]
```

`branches:` is not optional in practice — the compiler warns without it, because otherwise
the workflow fires for runs on every branch in the repository.

`conclusion:` is documented but **rejected in v0.83.4**. Filter in the frontmatter instead:

```yaml
if: github.event.workflow_run.conclusion == 'failure'
```

Or, when the workflow handles several conclusions differently, let it fire for all of them and
branch in the prompt on `${{ github.event.workflow_run.conclusion }}` — the value is known, so
this is reading a fact rather than making a judgement.

`workflow_run` is how you cross a wait without holding a runner. A workflow that opens a PR
should stop there; a second workflow triggered by CI's completion picks the thread back up.

### `slash_command`

```yaml
on:
  slash_command:
    name: review
    events: [pull_request_comment]
```

Defaults to the filename as the command name and to all events. Access defaults to users with
write permission.

---

## Rung-1 filters

All of these live under `on:` alongside the events.

### `names:` — label filtering

```yaml
on:
  issues:
    types: [labeled, unlabeled]
    names: [bug, critical, security]
```

Replaces "continue only if the label added was X". Also available on `pull_request`.

### `roles:` — who may trigger

```yaml
on:
  roles: [admin, maintainer, write]
```

Defaults to `[admin, maintainer, write]`. **Exact match, not a minimum**, so `roles: [write]`
rejects an admin. `roles: "all"` allows any authenticated user and should be treated as a
decision, not a convenience.

This is the correct place for an authorisation check. A prompt instruction saying "the comment
author must be a collaborator" is a security control implemented as a request to a model that
is reading the untrusted comment.

### `bots:` and `skip-bots:`

```yaml
on:
  bots: ["dependabot[bot]"]     # allow only these bots
  skip-bots: true               # ignore all bots
```

`skip-bots` replaces "and the comment was not written by you". A workflow is not triggered by
its own comment, but it can be triggered by another bot's.

### `skip-author-associations:`

```yaml
on:
  skip-author-associations:
    issue_comment: [first_time_contributor, none]
```

Finer than `roles:` when the distinction is contribution history rather than permission.

### `forks:`

```yaml
on:
  pull_request:
    types: [opened, synchronize]
    forks: ["trusted-org/*"]
```

`["owner/repo"]`, `["owner/*"]`, or `["*"]`. On a self-hosted runner this is the difference
between a fork PR running arbitrary code on your box and not.

### `skip-if-match:` and `skip-if-no-match:`

GitHub search queries evaluated before activation.

```yaml
on:
  schedule: daily
  skip-if-no-match:
    query: "is:issue is:open label:implement"
    min: 1
```

```yaml
on:
  schedule: daily
  skip-if-match: 'is:issue is:open in:title "[daily-report]"'
```

`max:` on `skip-if-match` and `min:` on `skip-if-no-match` set the threshold. Queries are
repo-scoped unless you set `scope: none`, which is how you search across an org.

This pair replaces a recipe's `exit 75` "nothing to do" task exactly, and it does it without
starting anything.

### `lock-for-agent:`

```yaml
on:
  issues:
    types: [opened, edited]
    lock-for-agent: true
```

Locks the issue while the agent works and unlocks it afterwards, so a human cannot edit under
the agent mid-run. Ignored for pull requests, which cannot be locked.

---

## Other `on:` keys

| Field | Notes |
|---|---|
| `if:` | Top-level condition. Folded into the activation job's condition |
| `stop-after:` | `"+25h"`, `"2026-09-01"`. Stops the workflow triggering after a deadline |
| `runtime:` / `run-name:` | `run-name:` accepts expressions, e.g. `${{ github.event.issue.title }}` |
| `reaction:` | Adds a reaction to the triggering item so a human can see the workflow noticed |
| `status-comment:` | Posts a started/finished comment linking the run. Noisy once trusted |
| `manual-approval:` | Requires an environment approval before the run proceeds |

---

## Where it runs

| Field | Notes |
|---|---|
| `runs-on:` | **Platform: `ubuntu-latest`.** The agent job |
| `runs-on-slim:` | **Platform: `ubuntu-latest`.** The framework jobs (activation, pre-activation, safe outputs, conclusion). Defaults to `ubuntu-slim` if omitted |
| `timeout-minutes:` | **Platform: always set.** Default 20, which is too short |
| `env:` | Top-level key-value pairs available to agent `steps:` and interpolated into the prompt. Use for labels, markers, paths, comment templates, and `ISSUE_CONTEXT_PATH` |
| `concurrency:` | String or object. `group:`, `cancel-in-progress:`, `queue: single \| max`, `job-discriminator:` |
| `environment:` | Ties the run to an Actions environment, so protection rules and approvals apply |

### Concurrency defaults

The compiler generates a group when you do not, keyed by trigger type:

| Trigger | Group | Cancels in progress |
|---|---|---|
| `issues` | per issue number | no |
| `pull_request` | per PR number or ref | **yes** |
| `push` | per ref | no |
| `schedule` and others | per workflow | no |

A PR-triggered workflow cancels its own earlier run by default, which is usually right but is
wrong for anything that pushes. A workflow whose real constraint is "one at a time across the
whole repository" needs an explicit group, because the default is per-item:

```yaml
concurrency:
  group: implement
  cancel-in-progress: false
```

---

## What model

| Field | Notes |
|---|---|
| `engine:` | `id`, `model`, `version`, `command`, `args`, `env`, `permission-mode`, `agent`, `api-target`, `bare`. **Platform: `opencode` via Forge** — see `references/opencode.md` |
| `model:` | Top-level alias. Provider segment must be one of `copilot`, `anthropic`, `openai`, `codex` |
| `max-turns:` | **Platform: `300`.** Tool-loop budget. The real guard against a confused agent looping |
| `max-turn-cache-misses:` | **Platform: `100`.** Forge has no prompt cache; every turn is a miss |
| `max-ai-credits:` | Default 1000. Only engages when traffic passes gh-aw's proxy accounting |
| `models:` | `allowed:` / `blocked:` model globs, plus pricing overrides |

---

## What it may read

| Field | Notes |
|---|---|
| `permissions:` | **Platform: `read-all`.** Every write goes through `safe-outputs` |
| `network:` | **Platform: explicit.** `allowed:` list of ecosystems and hostnames, plus `blocked:` |
| `tools:` | **Ignored under `engine: opencode`.** See `references/opencode.md` for the trap |
| `mcp-servers:` | Custom MCP servers. Also ignored under opencode |
| `checkout:` | Overrides the default shallow checkout. `fetch-depth`, `fetch`, `repository`, `path`, `sparse-checkout`, `submodules`, `lfs`, `current` |
| `cache:` | Standard Actions cache. Point `path:` at `/tmp/gh-aw/agent/` when caching precomputed data |
| `secrets:` | **Platform:** map `OPENAI_API_KEY` here for Forge; do not put it in `engine.env` |

### Network

`allowed:` accepts ecosystem identifiers and hostnames. Identifiers are validated at compile
time, so a typo is caught rather than silently ignored.

```
defaults  github  local  dev-tools  containers  playwright  chrome  fonts
python  node  go  java  ruby  rust  swift  php  dart  haskell  perl
terraform  bazel  linux-distros  dotnet
```

One leading wildcard is allowed (`*.cdn.example.com`); more than one is a compile error. A
bare hostname already covers its subdomains. URLs from domains outside the allowlist are
replaced with `(redacted)` in agent output.

Prefer ecosystem identifiers over individual hostnames for package registries. The `dotnet`
identifier expands to every NuGet-related domain, and `node` does the same for the npm/pnpm/yarn
ecosystem. Put them in `shared/platform-defaults.md` so every importing workflow inherits them.

---

## What it may write

Full surface in `references/safe-outputs.md`. The frontmatter shape:

```yaml
safe-outputs:
  threat-detection: false    # Platform agent workflow policy; declare locally, never in shared defaults
  create-pull-request:
    draft: false
  add-comment:
    target: "*"
  add-labels:
    allowed: [bot-working]
  jobs:                      # custom safe outputs
    notify:
      description: "…"
```

Global keys sit alongside the types: `staged:`, `github-token:`, `github-app:`,
`environment:`, `allowed-domains:`, `max-patch-size:`, `report-failure-as-issue:`,
`concurrency-group:`, `messages:`.

---

## Deterministic steps

| Field | Runs | Use for |
|---|---|---|
| `on.steps:` | Pre-activation job, before the agent job exists | Rung 2: gate only — decide whether to run at all |
| `on.permissions:` | Grants scopes to that job | Whatever `on.steps` needs |
| `on.needs:` | Makes pre-activation depend on custom jobs | Fetching credentials before activation |
| `pre-steps:` | Agent job, before checkout | Minting a token |
| `steps:` | Agent job, after checkout, before the model | Rung 3: precompute into `/tmp/gh-aw/agent/` |
| `pre-agent-steps:` | Agent job, immediately before the model | Late setup that must survive base-branch restore |
| `post-steps:` | Agent job, after the model | Collecting evidence |
| `jobs:` | Separate jobs in the graph | Rung 4: selection with outputs, another runner, a matrix |

### Which job's outputs the prompt can read

Verified by compiling and reading the job graph:

| Job | In the agent job's `needs` | `${{ needs.<job>.outputs.* }}` in the prompt |
|---|---|---|
| a custom `jobs:` entry | yes | resolves |
| `pre_activation` (`on.steps`) | **no** | **empty string** |
| `activation` | yes | resolves (`text`, `title`, `body`, `label_command`, …) |

`needs` is not transitive in GitHub Actions. `activation` depends on `pre_activation`, and
`agent` depends on `activation`, but that does not put `pre_activation` in the agent job's
`needs` context. The compiler will still emit
`GH_AW_NEEDS_PRE_ACTIVATION_OUTPUTS_FOO: ${{ needs.pre_activation.outputs.foo }}` into the
agent job if your prompt references it, which makes this look supported. It is not, and the
symptom is an empty value rather than an error.

### Step ordering inside the agent job

```
Checkout repository
steps:                                        <- rung 3
Checkout PR branch
Restore agent config folders from base branch  <- reverts GH_AW_AGENT_FILES
pre-agent-steps:                              <- after the restore
Write OpenCode Config                         <- engine config generated here
Execute OpenCode CLI
```

`GH_AW_AGENT_FILES` covers `AGENTS.md`, `CLAUDE.md`, `opencode.jsonc` and friends, restored
from the base branch on pull-request events. Anything that edits one of those files must run in
`pre-agent-steps:`, not `steps:`, or the restore silently undoes it on PR-triggered runs only.

---

## Composition

| Field | Notes |
|---|---|
| `imports:` | Shared markdown. Relative, `.github/`-rooted, or `owner/repo/path@ref`. Append `#Section` for one section, `?` to make it optional |
| `import-schema:` | Declares typed inputs for a shared file, read via `${{ github.aw.import-inputs.<key> }}` |
| `inlined-imports:` | Embeds imports into the lock file. Needed for cross-org `workflow_call` |
| `skills:` | External skill references, `owner/repo@<sha>` |
| `resources:` | Extra files fetched alongside the workflow |

Only one **agent file** (from `.github/agents/`) may be imported per workflow.

### What actually merges from an import

Verified by compiling and reading the lock file. Guessing here is expensive, because the
failures are silent.

| Field | Merges? |
|---|---|
| `network` | yes, `allowed` domains unioned |
| `safe-outputs` | yes, each type once, main wins on conflicts |
| `steps` | yes, imported ones **prepended** |
| `pre-agent-steps` | yes, prepended |
| `post-steps` | yes, appended |
| `tools`, `mcp-servers`, `env`, `checkout` | yes |
| `permissions` | **no** — validation only |
| `engine`, `model` | **no** — silently ignored |
| `runs-on`, `runs-on-slim` | **no** — warns `Ignoring unexpected frontmatter fields` |
| `on:` and its filters (`roles`, `reaction`, `names`) | **no**, except `skip-*` keys, `github-token`, `github-app` |

**`permissions` is the trap.** `permissions: read-all` in a shared file compiles with no
warning at all, and the agent job silently falls back to `contents: read` — a workflow that
looks read-all and is not. `runs-on` at least warns.

A Platform shared component can hold the network policy, threat detection, and pre-agent
steps; every workflow keeps its own `permissions`, `engine`, `model` and both runner keys.

A file appears at most once in an import graph, and circular imports fail at compile time.

---

## Templating in the body

| Form | Notes |
|---|---|
| `${{ github.event.* }}` | Event payload |
| `${{ needs.<job>.outputs.<name> }}` | Custom job (rung 4) outputs. Verified to reach the prompt |
| `${{ needs.activation.outputs.label_command }}` | Which label fired a `label_command` |
| `${{ steps.sanitized.outputs.text }}` | Sanitised triggering comment text. Use this, never the raw body |
| `{{#if expr }}…{{/if}}` | Conditional block. Verified |
| `{{#runtime-import path }}` | Inlines a file at runtime; `?` makes it optional; supports `file:45-52` line ranges |

`secrets.*`, `needs.pre_activation.outputs.*`, `env.*`, `vars.*` and `toJson()` are rejected in
the body. That is deliberate: the body is a prompt, and a secret interpolated into a prompt is
a leaked secret. `needs.pre_activation.outputs.*` compiles but resolves empty — use a custom job.

---

## Behaviour under test

| Field | Notes |
|---|---|
| `safe-outputs.staged: true` | Runs everything, writes nothing, prints what it would have done |
| `features:` | `intentional-failure:` for testing failure paths |
| `experiments:` | A/B variants, selected per run and readable as `${{ experiments.<name> }}` |
| `strict:` | Stricter validation |

```yaml
experiments:
  style: [concise, detailed]
---
Summarise this issue in a **${{ experiments.style }}** way.
```

gh-aw balances variant usage across runs and reports the split in `gh aw audit`.

---

## Known gaps between docs and v0.83.4

| Documented | Reality in v0.83.4 |
|---|---|
| `on.workflow_run.conclusion: [failure]` | **Rejected**: `Unknown property: conclusion`. Filter with a top-level `if:` on `github.event.workflow_run.conclusion` instead |
| `tools:` under any engine | Dropped entirely under `engine: opencode`. See `references/opencode.md` |
| `needs.pre_activation.outputs.*` in the prompt | Compiles, resolves **empty**. Use a custom job |
| `github.event.workflow_run.name` in the body | **Rejected** by the expression allowlist. Read `.name` from `gh api repos/…/actions/runs/<id>` in a job and pass it as an output |
| `merge-pull-request`, `link-sub-issue` | Valid, flagged experimental |

Before relying on any field this file does not confirm, probe it. `references/verify.md` has
the three-minute procedure.

---

## Safety notes

- Unsafe triggers (`push`, `issues`, `pull_request`, `issue_comment`) get permission checks
  by default. Do not disable them with `roles: "all"` without a reason you would defend.
- `pull_request_target` runs with the base repository's secrets against a fork's code. Avoid
  it. If it is unavoidable, PR-head checkout is disabled by default and should stay that way.
- Untrusted text belongs in `${{ steps.sanitized.outputs.text }}`, never the raw body.
- A workflow is not triggered by its own writes, so the obvious infinite loop is prevented.
  Two workflows triggering each other is not, and `concurrency` will not save you from it.
  Check the pair whenever you add a `workflow_run` edge.
