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
  # Off, and this is a costed decision rather than a shortcut.
  #
  # Threat detection is itself a model call: it asks a model to inspect the agent's output for
  # prompt injection, leaked secrets and malicious patches before any safe output is applied.
  # That is a second full model run per workflow run, looking for what the deterministic
  # scanners on a pull request already find — TruffleHog for secrets, Semgrep for the patch,
  # Trivy for dependencies. Paying tokens to repeat them is duplicated spend, so each project
  # owns this in CI instead.
  #
  # What bounds a hijacked agent is unchanged: `permissions: read-all` so it writes nothing
  # directly, an allowlist per safe output so it cannot reach a capability it was not granted,
  # an unauthenticated `gh`, and untrusted text arriving inside a marked boundary.
  #
  # Turn it on if the repository has no secret scanning or SAST on pull requests. It then needs
  # its own `engine`, or the one job reading the agent's output is the one job not using our
  # gateway.
  threat-detection: false
---
