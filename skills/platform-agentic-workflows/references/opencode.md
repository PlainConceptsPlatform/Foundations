# The engine: opencode on Forge

Verified against gh-aw **v0.83.4** by compiling against Numa.

Platform repositories run agentic workflows on our own model gateway. That involves one trick
and one significant trap, and neither is discoverable from the gh-aw docs.

---

## The contract

```yaml
engine:
  id: opencode
  version: 1.1.58
  env:
    OPENAI_BASE_URL: https://forge.plainconcepts.com/v1

model: openai/glm-5-2
secrets:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
max-turns: 30
max-turn-cache-misses: 100

network:
  allowed:
    - defaults
    - forge.plainconcepts.com
```

Six parts, all load-bearing:

1. **`id: opencode` and pinned `version`.** Experimental in gh-aw; the compiler says so on every compile. That
   warning is expected and is not a problem to fix.
2. **`OPENAI_BASE_URL`** points the OpenAI-compatible client at Forge.
3. **`model: openai/glm-5-2`.** The provider segment must be `openai` — see below.
4. **Root `secrets.OPENAI_API_KEY`.** It supplies the model client without putting the key in
   the agent's `engine.env`; the latter is rejected by strict compilation.
5. **Both turn budgets.** `max-turns` bounds tool loops; `max-turn-cache-misses` prevents
   otherwise healthy Forge runs failing at the compiler default of five consecutive misses.
   Forge has no prompt cache, so every turn is a cache miss. Set `max-turn-cache-misses: 100`
   to avoid the agent being killed mid-run.
6. **`network.allowed` includes `forge.plainconcepts.com`.** Forge is not in `defaults`, and
   the firewall will block it otherwise. That failure looks like a model timeout, not a network
   error, which makes it expensive to diagnose.

### Why the provider segment is `openai`

Naming our own gateway is rejected at compile time:

```
unsupported provider "plainconcepts";
supported providers: copilot, anthropic, openai, codex
```

The segment only selects which client library to use. Declaring the OpenAI-compatible one and
pointing `OPENAI_BASE_URL` at Forge routes there anyway. `plainconcepts/glm-5-2` fails
validation, and would achieve nothing if it passed: the compiler rewrites the prefix to
`awf-proxy` regardless, and Forge receives `glm-5-2` either way.

### Authentication and configuration

The API key must be mapped through root `secrets:`. Do not place `OPENAI_API_KEY` in
`engine.env`: strict compilation rejects it. Keep `opencode.ci.json` deliberately small and
direct — its top-level `model` should be `openai/glm-5-2` and its CI agent should use that model.
Do not introduce an `awf-proxy` provider, `engine.args --model`, or a CI merge step unless a
compiled workflow proves it is required.

The CI config is a tracked repository file. Anything only present on a developer machine —
agent selection, skills, MCP configuration, or permissions — does not exist in CI. Commit the
minimal configuration the workflow needs, and remove unused provider indirection: it increases
input complexity and makes failures harder to diagnose.

### Unattended repository reads

An Actions agent cannot approve a runtime permission request. If it must inspect repository
files, make that permission explicit in `opencode.ci.json`:

```json
{
  "permission": {
    "read": "allow",
    "external_directory": {
      "/tmp/**": "allow"
    }
  }
}
```

This permits reads in the checked-out repository and temporary context directory. It does not
grant GitHub write access or expose application, deployment, or third-party secrets. Diagnose
`The user rejected permission to use this specific tool call` as a CI permission configuration
problem, not as a model or Safe Outputs failure.

---

## The trap: `tools:` is ignored

```
⚠ 'tools' section ignored when using engine: opencode
  (OpenCode doesn't support MCP tool allow-listing)
```

The compiler prints that once and drops the **entire** `tools:` block. Verified by compiling a
workflow with `tools.cache-memory` configured and finding zero references to it in the
resulting 114KB lock file.

What that means:

| You wrote | What happens |
|---|---|
| `tools: bash: ["gh run view"]` | Dropped. The agent's shell is unrestricted |
| `tools: cache-memory:` | Dropped. No cache is created or restored |
| `tools: repo-memory:` | Dropped. No memory branch |
| `tools: github: toolsets: [issues]` | Dropped. The GitHub MCP server is mounted unrestricted |
| `tools: web-fetch:` | Dropped |
| `mcp-servers:` | Dropped |

Three consequences to act on:

**Do not write a `tools:` block.** It is dead configuration that reads like a control, which is
worse than absent: the next reader will believe the workflow is constrained when it is not.

**The constraints that remain are the ones that matter.** `permissions: read-all` means the
token cannot write. `safe-outputs` with `allowed:` lists means writes are enumerated and
validated. `network.allowed` means egress is filtered. `threat-detection` inspects the output.
Those are enforced outside the agent, so they hold regardless of what the engine supports.

**Persistence needs another mechanism.** No `cache-memory` means the CI-doctor pattern of
"remember which runs you already investigated" does not work as written. The options are
`safe-outputs` (write state where GitHub already stores it: a label, a comment, an issue body),
or an explicit `actions/cache` step at rung 3, or a `repo-memory`-shaped custom job at rung 6.
Prefer the first: GitHub is already the database, and state stored there is visible to humans.

---

## Budgets

| Field | Works under opencode | Notes |
|---|---|---|
| `timeout-minutes:` | yes | Job wall clock. Set generously; a build-and-test agent needs 60–90 |
| `max-turns:` | yes | Tool-loop budget. The real guard against a confused agent looping |
| `max-ai-credits:` | unreliable | Only engages when traffic passes gh-aw's proxy accounting |
| `tools.timeout:` | no | Inside the dropped block |

`max-turns` is the one to lean on. Set it where an honest run finishes comfortably and a
confused one stops.

---

## Cost telemetry

Two sources, and they are not equally reliable.

**gh-aw's proxy log** at `sandbox/firewall/logs/api-proxy-logs/token-usage.jsonl` in the run's
artifacts. One JSON object per line with model and token counts:

```json
{"model":"glm-5-2","input_tokens":1200,"output_tokens":340,
 "cache_read_input_tokens":500,"cache_creation_input_tokens":100}
```

**Expect it to be missing.** Routing through Forge means requests may not pass through gh-aw's
API proxy accounting at all. Absence is an expected outcome, not an error, and a cost workflow
must treat it that way rather than reporting a failure.

**The agent's own output** in the run log, which reports its token counts directly. This is
what `loop-task` surfaced as `{{opencode.tokens}}` and `{{opencode.cost}}`.

### Inline token usage in lifecycle comments

Token reporting in issue comments was removed. The AI Credits system tracks usage in the
Actions run summary, and `effective_tokens` is available as a job output if you need it for
debugging. Do not add `Tokens: ${{ needs.agent.outputs.effective_tokens }}` to lifecycle
comments — it was duplication, and Forge routing often produces `not reported` anyway.

`gh aw logs` and `gh aw audit <run-id>` give duration, tokens, credits and turn count per run
when the proxy did observe the traffic, and `gh aw logs --format markdown` gives a cross-run
report with anomaly detection.

---

## Self-hosted runners

Platform workflows currently target `ubuntu-latest`, switched from `[self-hosted, linux,
agents]` in `0fc7b08`. If a repository moves back to the self-hosted runner, these apply.

**Never on a public repository.** A pull request from a fork would execute arbitrary code on a
machine holding your credentials. Private and internal only. On GitHub-hosted runners a public
repository is fine.

Both runner keys must be set, or the framework jobs go to a GitHub-hosted `ubuntu-slim`:

```yaml
runs-on: [self-hosted, linux, agents]
runs-on-slim: [self-hosted, linux, agents]
safe-outputs:
  threat-detection:
    runs-on: [self-hosted, linux, agents]
```

A persistent machine breaks two assumptions a hosted runner lets you make:

- **A step that installs something may find it already there.** `gh extension install
  github/gh-aw` exits non-zero with *"there is already an installed extension"*. Fall back to
  `upgrade` and assert with `gh aw version`.
- **The runner's user does not own `/usr/share`.** `actions/setup-dotnet` installs there by
  default and fails on permissions. Set `DOTNET_INSTALL_DIR` to
  `${{ runner.tool_cache }}/dotnet`.

Write transient state to `$RUNNER_TEMP`, never a hardcoded path. Do not assume root, and do not
install into shared system paths.

One runner means everything queues behind everything else: a PR check can wait on an agent run.
That is an argument for keeping the agent's work short and moving waits onto `workflow_run`
rather than polling inside a run.

Known upstream issue: `runs-on` can revert to defaults after `gh aw upgrade` or
`gh aw compile`. Re-check both runner keys after either command.

---

## Other engines

If a repository has reason to use something else:

| Engine | `id` | Needs |
|---|---|---|
| GitHub Copilot (gh-aw default) | `copilot` | `copilot-requests: write` or `COPILOT_GITHUB_TOKEN` |
| Claude Code | `claude` | `ANTHROPIC_API_KEY` |
| OpenAI Codex | `codex` | `OPENAI_API_KEY` |
| Google Gemini | `gemini` | `GEMINI_API_KEY` |

`claude` and `copilot` both support `tools:` properly, so a repository that genuinely needs
tool allow-listing or `cache-memory` has a reason to pick one. That is a deliberate trade
against Forge, not a default: state it in the workflow's `description:` if you make it.
