---
description: |
  The parts of the Platform agentic-workflow contract that gh-aw will actually merge from an
  import. Import it from every agentic workflow in the repository.

  Verified against gh-aw v0.83.4 by compiling and reading the generated lock file. What can
  and cannot live here is not obvious, so it is recorded rather than guessed:

  | Field                        | Merges? |
  |------------------------------|---------|
  | `network`                    | yes, allowed domains are unioned |
  | `safe-outputs.threat-detection` | yes, alongside the importer's own safe outputs |
  | `steps` / `pre-agent-steps` / `post-steps` | yes, imported ones are prepended (appended for post) |
  | `tools` / `mcp-servers` / `env` / `checkout` | yes |
  | `permissions`                | **NO** — validation only |
  | `engine` / `model`           | **NO** — silently not merged |
  | `runs-on` / `runs-on-slim`   | **NO** — warns "Ignoring unexpected frontmatter fields" |
  | `on:` and its filters (`roles`, `reaction`, `names`) | **NO**, except `skip-*` keys |

  The `permissions` row is the dangerous one. Putting `permissions: read-all` here looks like
  it works and compiles without a warning, but the agent job silently falls back to
  `contents: read`. Every workflow therefore keeps its own `permissions: read-all`, and so do
  `engine`, `model`, `runs-on` and `runs-on-slim`.

network:
  allowed:
    - defaults
    # The model gateway. Not in `defaults`, and the firewall blocking it presents as a model
    # timeout rather than a network error, which is expensive to diagnose.
    - forge.plainconcepts.com

safe-outputs:
  # Infrastructure, not a capability grant: it inspects agent output for prompt injection,
  # leaked secrets and malicious patches before any safe output is applied. Pinned so it does
  # not drift onto a different runner than the agent. Each workflow still declares its own
  # write capabilities, which stay visible where they are granted.
  threat-detection:
    runs-on: ubuntu-latest
---
