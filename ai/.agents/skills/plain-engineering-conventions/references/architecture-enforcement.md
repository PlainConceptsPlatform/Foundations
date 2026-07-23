# Architecture Enforcement

Codify architecture rules as executable tests and linter rules — not just prose documentation.

## Principle

**Architecture rules that exist only in documentation will be violated.** Rules must be enforced by
automated tools that run on every commit or pull request, blocking merge on violation.

## What to Enforce

| Rule category | Examples |
|---------------|---------|
| **Layer dependencies** | Module A must not import Module B's implementation; only Contracts |
| **Circular references** | No circular dependencies between packages/projects |
| **Contract purity** | Contracts package contains only interfaces and event types — no implementations |
| **Handler visibility** | Handlers must be module-internal (not publicly exported) |
| **Entity exposure** | Domain entities must not appear in API request/response types |
| **Naming conventions** | Handlers end in `Handler`, validators end in `Validator`, etc. |

## Enforcement Tools by Language

| Language | Architecture tests | Static analysis / linters |
|----------|-------------------|--------------------------|
| .NET | NetArchTest, ArchUnitNET | Roslyn analyzers (custom rules) |
| Java | ArchUnit | Error Prone, SpotBugs, Checkstyle |
| Python | import-linter, pytestarch | Ruff, pylint, custom AST checks |
| TypeScript | eslint-plugin-boundaries, dependency-cruiser | ESLint with custom rules |
| Go | `go vet`, depguard | golangci-lint with custom linters |
| Rust | cargo-deny, clippy | Custom `#[deny]` attributes |

## Architecture Test Structure

Architecture tests live in a dedicated test project/package — separate from unit and integration
tests. They assert on the code structure itself, not on runtime behavior.

```
tests/
  ArchTests/
    ModuleBoundaryTests        ← Modules must not reference each other's internals
    LayerDependencyTests       ← Layer dependency rules (permitted/forbidden)
    ContractPurityTests        ← Contracts contain only interfaces and events
    HandlerConventionTests     ← Handlers are sealed, naming conventions followed
    NamingConventionTests      ← Classes follow project naming patterns
```

### Example Rules (Pseudocode)

```
# Module boundary
ASSERT types in "Modules.Orders"
  DO NOT depend on types in "Modules.Catalog" (implementation)
  BUT MAY depend on types in "Modules.Catalog.Contracts"

# Contract purity
ASSERT types in "*.Contracts"
  ARE ONLY interfaces OR record/data-class types
  DO NOT contain classes with method implementations

# Handler visibility
ASSERT types implementing CommandHandler or QueryHandler
  ARE module-internal (not publicly exported)
```

## CI Gate

Architecture tests must run as part of the CI pipeline, positioned **after unit tests** and
**before deployment**:

```
lint → build → unit tests → architecture tests → integration tests → deploy
```

A failing architecture test **blocks the merge**. No exceptions, no manual overrides for "just this
once."

## Typical Failure Modes

| Failure | Root cause | Fix |
|---------|-----------|-----|
| Module A imports Module B's handler | Developer took a shortcut | Use Contract interface instead |
| Entity type appears in API response | Missing DTO mapping | Create a dedicated response record |
| Public handler class | Forgot to restrict visibility | Change to module-internal (not publicly exported) |
| Implementation in Contracts package | Misplaced code | Move to the module's core package |
| Circular dependency detected | Two modules reference each other | Extract shared types to Contracts or introduce a domain event |
