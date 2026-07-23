---
name: plain-dotnet-guardrails
description: >
  Plain Concepts .NET guardrails covering architecture rules, build hygiene, and code quality conventions.
  Use when the user asks to: check .NET conventions, review .NET architecture rules, understand build
  configuration, check Directory.Build.props setup, review central package management, check .editorconfig
  conventions, or verify architecture tests are in place.
  Triggered by: ".NET conventions", ".NET architecture rules", "dotnet guardrails", "build hygiene",
  "Directory.Build.props", "Directory.Packages.props", "central package management", "editorconfig",
  "arch tests", "architecture tests", "how do .NET modules communicate", "skill order".
metadata:
  plugin: pc-companion
  author: "Andoni Santamaria"
---

## Plain Concepts .NET Guardrails

Read `@skill:plain-engineering-conventions` for the language-agnostic parent standard.

This skill provides .NET-specific reference documentation for all Plain Concepts .NET Modular Monolith skills.
All other skills (`plain-dotnet-shell`, `plain-dotnet-arch-vsa`, `plain-dotnet-module`, `plain-dotnet-use-cases`) begin with
`Read @skill:plain-dotnet-guardrails before executing.`

**Do NOT use this skill to scaffold anything.** It is reference-only.

## Reference Documents

| Document | Purpose |
|----------|---------|
| [vertical-slice-cqs.md](./references/vertical-slice-cqs.md) | Feature-per-folder structure, Command/Query Separation |
| [token-reference.md](./references/token-reference.md) | Master table of all `__TOKEN__` names |
| [preflight-checks.md](./references/preflight-checks.md) | Standard pre-flight detection patterns |
| [arch-rules.md](./references/arch-rules.md) | VSA+CQS layer dependency rules |
| [di-conventions.md](./references/di-conventions.md) | Scrutor DI assembly scanning patterns |
| [aspire-conventions.md](./references/aspire-conventions.md) | Aspire resource naming and connection strings |
| [error-handling.md](./references/error-handling.md) | ErrorOr + ProblemDetails (RFC 7807) mapping |
| [logging-conventions.md](./references/logging-conventions.md) | ILogger<T> usage and log level guidelines |
| [modular-monolith-guide.md](./references/modular-monolith-guide.md) | What a module is and bounded context rules |
| [skill-invocation-order.md](./references/skill-invocation-order.md) | 5-skill dependency chain and invocation guide |
| [manual-module-guide.md](./references/manual-module-guide.md) | How to add a module without the skill |
| [skill-maintenance.md](./references/skill-maintenance.md) | How to update tokens, stubs, and package versions |
| [cross-module-communication.md](./references/cross-module-communication.md) | Cross-module communication patterns |
| [build-defaults.md](./references/build-defaults.md) | `Directory.Build.props` and `.targets` ÔÇö what to check and why it matters |
| [central-package-management.md](./references/central-package-management.md) | `Directory.Packages.props` CPM ÔÇö what to flag and common errors |
| [editorconfig-conventions.md](./references/editorconfig-conventions.md) | `.editorconfig` ÔÇö structure, naming rules, severity levels, CI enforcement |
| [arch-tests-conventions.md](./references/arch-tests-conventions.md) | Architecture test project ÔÇö mandatory tests, stack, and when to add more |

## Quick Token Reference

| Token | Meaning |
|-------|---------|
| `__PROJECT_NAME__` | Solution/namespace root (PascalCase) |
| `__MODULE_NAME__` | Module name (PascalCase) |
| `__ENTITY_NAME__` | Entity name (PascalCase) |
| `__ENTITY_NAME_PLURAL__` | Plural entity name (PascalCase) |
| `__ENTITY_NAME_LOWER__` | Entity name lowercase (for routes/tables) |
| `__MODULE_NAME_LOWER__` | Module name lowercase (for routes/schema) |

## Skill Invocation Order

```
plain-dotnet-guardrails  ÔåÉ  no dependencies (standalone reference)
plain-dotnet-shell              ÔåÉ  reads plain-dotnet-guardrails
plain-dotnet-arch-vsa           ÔåÉ  requires plain-dotnet-shell output
plain-dotnet-module             ÔåÉ  requires plain-dotnet-arch-vsa output
plain-dotnet-use-cases          ÔåÉ  requires plain-dotnet-module output
```

Read the full guide: [skill-invocation-order.md](./references/skill-invocation-order.md)
