# The engine: opencode on Forge

Verified against gh-aw **v0.83.4** by compiling against Numa.

Platform repositories run agentic workflows on our own model gateway. That involves one trick
and one significant trap, and neither is discoverable from the gh-aw docs.

---

## The contract

```yaml
engine:
  id: opencode
  env:
    OPENAI_BASE_URL: https://forge.plainconcepts.com/v1
  args:
    - "--model"
    - "awf-proxy/glm-5-2"

model: openai/glm-5-2

network:
  allowed:
    - defaults
    - forge.plainconcepts.com
```

Four parts, all load-bearing:

1. **`id: opencode`.** Experimental in gh-aw; the compiler says so on every compile. That
   warning is expected and is not a problem to fix.
2. **`OPENAI_BASE_URL`** points the OpenAI-compatible client at Forge.
3. **`model: openai/glm-5-2`.** The provider segment must be `openai` — see below.
4. **`network.allowed` includes `forge.plainconcepts.com`.** Forge is not in `defaults`, and
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

### Authentication

The compiled workflow reads `OPENAI_API_KEY`, falling back to `CODEX_API_KEY`. Both are repo
secrets, and no `secrets:` block is needed — an earlier attempt to add one mapped nothing and
was removed.

An API key rather than the SSO path because Forge's device-flow tokens expire in 900 seconds,
so a secret holding one is stale within fifteen minutes.

The key is held by gh-aw's firewall proxy and excluded from the agent's environment
(`--exclude-env OPENAI_API_KEY`), so the agent never sees it.

### What actually runs

A plain `opencode run` inside the firewall proxy's container, not `--attach`. A persistent
`opencode serve` on the runner is therefore not used: the model and the gateway are ours, the
process is not.

---

## gh-aw writes `opencode.jsonc` for you

This is the part that is invisible from the frontmatter and causes the most confusion. The
agent job contains a generated step, **Write OpenCode Config**, which does this:

```bash
CONFIG="$GITHUB_WORKSPACE/opencode.jsonc"
BASE_CONFIG='{ …agent permissions…, "autoupdate": false,
               "disabled_providers": ["opencode", "openai"],
               "provider": { "awf-proxy": {
                 "api": "http://172.30.0.30:10002",
                 "options": { "apiKey": "awf-copilot-proxy" },
                 "models": { "claude-sonnet-4.5": {} } } } }'
if [ -f "$CONFIG" ]; then
  MERGED=$(jq -n --argjson base "$BASE_CONFIG" --argjson existing "$(cat "$CONFIG")" '$existing * $base')
  echo "$MERGED" > "$CONFIG"
else
  echo "$BASE_CONFIG" > "$CONFIG"
fi
```

Four consequences worth knowing before you debug a model problem:

**The merge direction is `$existing * $base`, so gh-aw wins on conflicting keys.** Distinct
keys survive, and `jq`'s `*` recurses, so adding
`provider.awf-proxy.models.<yours>` yields both your model and gh-aw's rather than replacing it.

**The provider address is `172.30.0.30:10002`.** The sandbox exposes 10000–10003 and all four
are in `NO_PROXY`, but 10002 is the one gh-aw designates for models. Hardcoding a different
port works only until it moves.

**The model in `BASE_CONFIG` is hardcoded**, not derived from your `model:`. With
`model: openai/glm-5-2` the config still declares `claude-sonnet-4.5` under `awf-proxy`, so
`awf-proxy/glm-5-2` refers to a model the provider does not list. Declare it yourself.

**`OPENCODE_MODEL` outranks the config file.** gh-aw sets
`OPENCODE_MODEL: awf-proxy/<model>` in the agent job's env, rewriting your provider prefix to
`awf-proxy`. So the config's `model` key is not the deciding factor in CI — the frontmatter
`model:` is. Setting `model` in a config file and expecting it to win is a common wrong guess.

### The engine's repo config must be tracked

`opencode.jsonc` is a **tracked repository file**, not just a developer's preference. In a CI
checkout the agent gets whatever git provides plus gh-aw's merge, so anything only present on
someone's laptop does not exist.

Untracking it silently removes, from CI only:

- `default_agent` — so `--agent` selection falls back
- `skills.paths` — so *"load every skill available to you"* finds nothing
- `mcp` servers — so any tool they provided is gone
- `permission` — so the agent's own allow-list defaults change

None of that fails loudly. The run proceeds with a less capable agent and produces worse work,
which is much harder to diagnose than a crash. If a prompt depends on skills or slash commands,
the config that defines them has to be committed.

### Splitting CI-only config out of it

Sandbox-only settings — a provider pointing at an address that exists only inside the firewall —
are noise on a developer machine. Keep them in a separate tracked fragment and merge it in CI:

```yaml
# .github/workflows/shared/opencode-ci.md — imported by every agentic workflow
pre-agent-steps:
  - name: Merge the CI-only OpenCode provider into opencode.jsonc
    run: |
      set -euo pipefail
      CONFIG=opencode.jsonc
      FRAGMENT=opencode.ci.json
      [ -f "$FRAGMENT" ] || { echo "::error::$FRAGMENT is missing"; exit 1; }
      jq -e . "$FRAGMENT" > /dev/null || { echo "::error::$FRAGMENT is not valid JSON"; exit 1; }
      if [ -f "$CONFIG" ]; then
        merged=$(jq -s '.[0] * .[1]' "$CONFIG" "$FRAGMENT")   # fragment wins
      else
        merged=$(jq -S . "$FRAGMENT")
      fi
      printf '%s\n' "$merged" > "$CONFIG"
```

Three details that are each a bug if you get them wrong:

- **`pre-agent-steps:`, not `steps:`.** `GH_AW_AGENT_FILES` lists `opencode.jsonc` alongside
  `AGENTS.md` and `CLAUDE.md`, and the generated *Restore agent config folders from base branch*
  step reverts them — a supply-chain guard that stops an agent editing its own instructions in a
  PR. That restore sits between `steps:` and `pre-agent-steps:`, so a merge in `steps:` is undone
  on pull-request events and nowhere else.
- **Handle the file being absent.** Untracked, or excluded by a sparse checkout, means no file to
  merge into.
- **Pure JSON, not JSONC.** `jq` cannot parse `//` comments, and a naive comment-stripper
  corrupts the `http://` in an api URL. Name it `.json` and validate with `jq -e .` so a later
  edit fails loudly.

Compiling a new secret name triggers gh-aw's **safe update mode**, which refuses to proceed
and asks for a security review. That is working as designed. Pass `--approve` once you have
read what changed, and note the new secret in the pull request description.

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
`agent-report-cost.md` carried a `bash:` allowlist that never did anything.

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

### Report it from a separate workflow

```yaml
on:
  workflow_run:
    workflows:
      - "Agent: Implement Issue"
      - "Agent: Merge Gate"
    types: [completed]
    branches: [main]

safe-outputs:
  add-comment:
    target: "*"
```

One implementation instead of a final step in every workflow, and a failure while reporting
cannot fail the work that was already done.

Never estimate a missing figure. Write "not reported by this source": a fabricated cost is
worse than a gap, because someone will budget against it.

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
