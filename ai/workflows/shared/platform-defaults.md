---
description: |
  The parts of the Platform agentic-workflow contract that gh-aw will actually merge from an
  import. Imported by every agentic workflow in this repository.

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

  The full merge table is in the `platform-agentic-workflows` skill at
  `references/frontmatter.md`.

network:
  allowed:
    - defaults
    # Our model gateway. Not in `defaults`, and the firewall blocking it presents as a model
    # timeout rather than a network error, which is expensive to diagnose.
    - forge.plainconcepts.com
    # .NET package restore
    - dotnet
    - api.nuget.org
    - nuget.org
    # Node.js package install (pnpm/npm)
    - node
    # Google Fonts
    - fonts
    # GitHub release assets (RTK, codegraph binary downloads)
    - releaseassets.githubusercontent.com
    - objects.githubusercontent.com

safe-outputs:
  threat-detection: false
---
