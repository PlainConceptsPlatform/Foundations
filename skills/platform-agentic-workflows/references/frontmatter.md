# Frontmatter reference

Verified against gh-aw **v0.83.4**. Where the published docs and the installed compiler
disagree, the compiler wins and the disagreement is noted.

Fields are grouped by what they decide. Anything marked **Platform** is part of the contract
in `SKILL.md`; anything marked *avoid* has a reason attached.

---

## Identity

| Field | Notes |
|---|---|
| `name:` | **Platform: required.** The display name in Actions, and the string `workflow_run.workflows` matches. Not the filename. Getting this wrong makes a chained workflow silently never fire |
| `description:` | **Platform: required.** Free prose, compiled into a comment in the `.lock.yml`. Kept out of the prompt, so this is where the human explanation belongs |
| `emoji:` | Cosmetic |
| `labels:` | Categorises the workflow itself for `gh aw list --label`. Not issue labels |
| `source:` | `owner/repo/path@ref`. Set by `gh aw add`; enables `gh aw update` |
| `tracker-id:` | Min 8 chars. Tags every asset the workflow creates so they can be found later |
| `metadata:` | Arbitrary key-value pairs |

---

## When it fires

See `references/triggers.md` for the full trigger surface. The frontmatter-level essentials:

| Field | Notes |
|---|---|
| `on:` | Standard Actions events plus gh-aw extensions |
| `if:` | Top-level condition. Folded into the activation job's condition |
| `stop-after:` | `"+25h"`, `"2026-09-01"`. Stops the workflow triggering after a deadline. Useful for a trial |
| `runtime:` / `run-name:` | `run-name:` accepts expressions, e.g. `${{ github.event.issue.title }}` |

---

## Where it runs

| Field | Notes |
|---|---|
| `runs-on:` | **Platform: `ubuntu-latest`.** The agent job |
| `runs-on-slim:` | **Platform: `ubuntu-latest`.** The framework jobs (activation, pre-activation, safe outputs, conclusion). Defaults to `ubuntu-slim` if omitted, which quietly moves them off your runner |
| `timeout-minutes:` | **Platform: always set.** Default 20, which is too short for anything that builds |
| `concurrency:` | String or object. `group:`, `cancel-in-progress:`, `queue: single \| max`, `job-discriminator:` |
| `container:` / `services:` | Available; unused on Platform |
| `environment:` | Ties the run to an Actions environment, so protection rules and approvals apply |

### Concurrency defaults

The compiler generates a group when you do not, keyed by trigger type:

| Trigger | Group | Cancels in progress |
|---|---|---|
| `issues` | per issue number | no |
| `pull_request` | per PR number or ref | **yes** |
| `push` | per ref | no |
| `schedule` and others | per workflow | no |

Two consequences. A PR-triggered workflow cancels its own earlier run by default, which is
usually right but is wrong for anything that pushes. And a workflow whose real constraint is
"one at a time across the whole repository" needs an explicit group, because the default is
per-item:

```yaml
concurrency:
  group: implement
  cancel-in-progress: false
```

`queue: max` (the compiler's default for generated groups) queues pending runs and runs them
in arrival order. `queue: single` keeps only the newest pending run.

---

## What model

| Field | Notes |
|---|---|
| `engine:` | `id`, `model`, `version`, `command`, `args`, `env`, `permission-mode`, `agent`, `api-target`, `bare`. **Platform: `opencode` via Forge** — see `references/opencode.md` |
| `model:` | Top-level alias. Provider segment must be one of `copilot`, `anthropic`, `openai`, `codex` |
| `max-turns:` | Tool-loop budget. Claude and opencode honour it |
| `max-ai-credits:` | Default 1000. Only engages when traffic passes gh-aw's proxy |
| `models:` | `allowed:` / `blocked:` model globs, plus pricing overrides |

---

## What it may read

| Field | Notes |
|---|---|
| `permissions:` | **Platform: `read-all`.** Every write goes through `safe-outputs` |
| `network:` | **Platform: explicit.** `allowed:` list of ecosystems and hostnames, plus `blocked:` |
| `tools:` | **Ignored under `engine: opencode`.** See the trap below |
| `mcp-servers:` | Custom MCP servers. Also ignored under opencode |
| `checkout:` | Overrides the default shallow checkout. `fetch-depth`, `fetch`, `repository`, `path`, `sparse-checkout`, `submodules`, `lfs`, `current`. Accepts a list for multi-repo |
| `cache:` | Standard Actions cache. Point `path:` at `/tmp/gh-aw/agent/` when caching precomputed data |
| `secrets:` | Maps repo secrets into the run. Not needed for the Forge setup |
| `env:` | Environment variables for the agent job |

### The `tools:` trap

```
⚠ 'tools' section ignored when using engine: opencode
  (OpenCode doesn't support MCP tool allow-listing)
```

The compiler emits that warning once and drops the **entire** block. Everything nested under
it goes with it, including `cache-memory:` and `repo-memory:`, which look like storage
configuration rather than tool configuration and are easy to believe survived. They do not.

Consequences:

- Do not write a `tools:` block in a Platform workflow. It is noise that reads as a control.
- A `bash:` allowlist is not a security boundary here. The agent's shell is unrestricted.
  Constrain behaviour with `permissions: read-all`, `safe-outputs`, and `network.allowed`.
- If you need persistence across runs, it must be a real artifact or a `safe-outputs` write.
  Verify anything else by probing (`references/verify.md`).

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
replaced with `(redacted)` in agent output, which is a data-exfiltration control as much as
an egress one.

---

## What it may write

Full surface in `references/safe-outputs.md`. The frontmatter shape:

```yaml
safe-outputs:
  threat-detection:          # Platform: pin runs-on
    runs-on: ubuntu-latest
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
| `pre-agent-steps:` | Agent job, immediately before the model | Late setup |
| `post-steps:` | Agent job, after the model | Collecting evidence |
| `jobs:` | Separate jobs in the graph | Rung 4: selection with outputs, another runner, a matrix |

Verified: a `steps:` entry lands in the agent job between the activation-artifact download
and the git-credentials configuration. `/tmp/gh-aw/agent/` exists at that point.

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
looks read-all and is not. `runs-on` at least warns. `engine` gives the confusing pair of a
deprecation warning from the shared file and `engine.model is required` from the importer.

So a Platform shared component can hold the network policy, threat detection, and pre-agent
steps; every workflow keeps its own `permissions`, `engine`, `model` and both runner keys.

A file appears at most once in an import graph, and circular imports fail at compile time.

### Step ordering inside the agent job

Verified placement, which decides where a config-mutating step must go:

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
`pre-agent-steps:`, not `steps:`, or the restore silently undoes it on PR-triggered runs only —
which is the worst kind of bug, because it works everywhere else.

---

## Behaviour under test

| Field | Notes |
|---|---|
| `safe-outputs.staged: true` | Runs everything, writes nothing, prints what it would have done. The first rung of a safe rollout |
| `features:` | `intentional-failure:` for testing failure paths |
| `experiments:` | A/B variants, selected per run and readable as `${{ experiments.<name> }}` |
| `strict:` | Stricter validation |

### Experiments

```yaml
experiments:
  style: [concise, detailed]
---
Summarise this issue in a **${{ experiments.style }}** way.
```

gh-aw balances variant usage across runs and reports the split in `gh aw audit`. Falsy
variant values (`no`, `false`, `0`, empty) work with `{{#if experiments.<name> }}` blocks, so
a yes/no experiment reads naturally. Default storage is a git branch, which needs
`contents: write`; `storage: cache` avoids that at the cost of 7-day eviction.

---

## Templating in the body

| Form | Notes |
|---|---|
| `${{ github.event.* }}` | Event payload |
| `${{ needs.pre_activation.outputs.<name> }}` | Rung 2 outputs. Verified to reach the prompt |
| `${{ needs.<job>.outputs.<name> }}` | Rung 4 outputs. Verified |
| `${{ needs.activation.outputs.label_command }}` | Which label fired a `label_command` |
| `${{ steps.sanitized.outputs.text }}` | Sanitised triggering comment text. Use this, never the raw body |
| `{{#if expr }}…{{/if}}` | Conditional block. Verified |
| `{{#runtime-import path }}` | Inlines a file at runtime; `?` makes it optional; supports `file:45-52` line ranges |

`secrets.*`, `env.*`, `vars.*` and `toJson()` are rejected in the body. That is deliberate:
the body is a prompt, and a secret interpolated into a prompt is a leaked secret.

---

## Known gaps between docs and v0.83.4

| Documented | Reality in v0.83.4 |
|---|---|
| `on.workflow_run.conclusion: [failure]` | **Rejected**: `Unknown property: conclusion`. Filter with a top-level `if:` on `github.event.workflow_run.conclusion` instead |
| `tools:` under any engine | Dropped entirely under `engine: opencode` |
| `needs.pre_activation.outputs.*` in the prompt | Compiles, resolves **empty**. Use a custom job |
| `github.event.workflow_run.name` in the body | **Rejected** by the expression allowlist. Read `.name` from `gh api repos/…/actions/runs/<id>` in a job and pass it as an output |
| `merge-pull-request`, `link-sub-issue` | Valid, flagged experimental |

Before relying on any field this file does not confirm, probe it. `references/verify.md` has
the three-minute procedure.
