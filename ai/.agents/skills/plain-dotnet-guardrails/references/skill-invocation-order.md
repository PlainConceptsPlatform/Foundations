# Skill Invocation Order

The 5 Plain Concepts skills form a dependency chain. Always invoke them in order.

## Dependency Chain

```
plain-dotnet-guardrails  ÔöÇÔöÇÔåÆ  (no deps ÔÇö standalone reference skill)
plain-dotnet-shell              ÔöÇÔöÇÔåÆ  reads @skill:plain-dotnet-guardrails
plain-dotnet-arch-vsa           ÔöÇÔöÇÔåÆ  requires: *.slnx exists (plain-dotnet-shell output)
plain-dotnet-module       ÔöÇÔöÇÔåÆ  requires: src/*.BuildingBlocks.Architecture.VSA.CQS/ exists (plain-dotnet-arch-vsa output)
plain-dotnet-use-cases    ÔöÇÔöÇÔåÆ  requires: at least one module in .slnx (plain-dotnet-module output)
```

## Skill Reference Table

| Skill | When to invoke | Pre-requisite | Output |
|-------|---------------|---------------|--------|
| `plain-dotnet-guardrails` | Any time ÔÇö for reference only | None | 12 reference docs |
| `plain-dotnet-shell` | Once per project | dotnet ÔëÑ 10.0.100, git | Compilable .NET solution (`.slnx`, `src/`, `tests/`, Aspire host) |
| `plain-dotnet-arch-vsa` | Once per project, after shell | `plain-dotnet-shell` complete (`.slnx` exists) | `BuildingBlocks.Architecture.VSA.CQS` + `ArchTests` projects |
| `plain-dotnet-module` | Once per bounded context | `plain-dotnet-arch-vsa` complete | 4 module projects (main, contracts, unit tests, functional tests) |
| `plain-dotnet-use-cases` | Once per entity, within a module | `plain-dotnet-module` complete (module in `.slnx`) | 5 CRUD use cases per entity (endpoint, command/query, handler, validator, errors) |

## Trigger Phrases (for Copilot Auto-Activation)

| Skill | Trigger phrases |
|-------|----------------|
| `plain-dotnet-guardrails` | ".NET conventions", "show me the token names", "what tokens does Plain use", ".NET architecture rules", "how do .NET modules communicate", "skill order" |
| `plain-dotnet-shell` | "new .NET project", "new dotnet solution", "bootstrap solution", "scaffold .NET app", "create new solution", "start a .NET project" |
| `plain-dotnet-arch-vsa` | "add VSA CQS architecture", "apply architecture", "add architecture layer", "apply VSA", "add BuildingBlocks", "add CQS" |
| `plain-dotnet-module` | "add module", "new module", "create module", "add bounded context", "new bounded context" |
| `plain-dotnet-use-cases` | "add CRUD", "add use cases", "generate use cases", "scaffold CRUD for", "create endpoints for", "add entity use cases" |

## FAQ

### Can I run plain-dotnet-use-cases without plain-dotnet-module?

**No.** `plain-dotnet-use-cases` requires an existing module to place use cases into. It detects the module by reading the `.slnx` file for projects containing `/Modules/` in their path. If no module is found, it halts with: *"No modules found. Run plain-dotnet-module first."*

### Can I run skills in parallel?

**No.** Each skill's output is a prerequisite for the next skill. The chain is strictly sequential:

1. `plain-dotnet-shell` creates the `.slnx` and solution structure that `plain-dotnet-arch-vsa` reads.
2. `plain-dotnet-arch-vsa` creates the `BuildingBlocks.Architecture.VSA.CQS` folder that `plain-dotnet-module` checks for.
3. `plain-dotnet-module` registers the module in `.slnx` that `plain-dotnet-use-cases` discovers.

### Can I run plain-dotnet-arch-vsa on an existing solution (not created by plain-dotnet-shell)?

**Yes**, with caution. `plain-dotnet-arch-vsa` only requires a `.slnx` file to exist. It adds new projects and does not modify existing ones. However, the `BuildingBlocks` project naming convention (`{ProjectName}.BuildingBlocks`) must not conflict with existing projects.

### Can I run plain-dotnet-module multiple times?

**Yes.** Each invocation creates a new bounded context. Run `plain-dotnet-module` once per module. Each execution is independent ÔÇö modules do not reference each other.

### Can I run plain-dotnet-use-cases multiple times in the same module?

**Yes.** Each invocation creates use cases for one entity. Run it once per entity. Use the duplicate check (see `preflight-checks.md`) to avoid overwriting existing use cases.

### Do I need to invoke plain-dotnet-guardrails?

**Not explicitly.** The other 4 skills read `@skill:plain-dotnet-guardrails` internally at the start of their SKILL.md. You can also invoke it directly if you want to browse the reference docs.
