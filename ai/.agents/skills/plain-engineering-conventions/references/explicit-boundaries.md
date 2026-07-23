# Explicit Boundaries

Public interfaces between components — no coupling to internal implementations.

## Principle

**Every component, module, or package has a public API surface and a private interior.**
Code outside a component may only depend on its public interface — never on its internal
implementation details. If it is not explicitly public, it is internal.

This principle applies whenever a codebase has two or more components, packages, or
bounded contexts. It does not require a Modular Monolith or any specific architecture style.

---

## Rules

### 1. Define a public API surface explicitly

Every module or package must have a clear boundary between what is public and what is internal.

| Approach | Examples |
|----------|---------|
| Explicit exports | `index.ts` barrel file (JS/TS), `__init__.py` (Python), `public` keyword (Java/Kotlin) |
| Access modifiers | `internal` (C#/Kotlin), package-private (Java), `pub(crate)` (Rust) |
| Interface files | Dedicated `contracts/` or `api/` sub-package containing only public types |

What is not in the public surface is an implementation detail — it can change without notice.

### 2. No reaching into internals

Importing or referencing internal types, functions, or classes from another component is forbidden.

```
// Forbidden — reaching into another module's internals
import { UserRepository } from '../users/infrastructure/UserRepository'

// Correct — depending only on the public interface
import { IUserService } from '../users/contracts/IUserService'
```

If you need something that is currently internal, the right answer is to promote it to the
public API — not to import it directly.

### 3. Dependencies flow in one direction

Dependency cycles between components are not allowed. If component A depends on B,
then B must not depend on A.

- Draw the dependency graph. It must be a DAG (directed acyclic graph).
- Cycles indicate missing abstractions or incorrect boundary placement.
- Shared types belong in a dedicated `contracts/` or `shared/` package — not in one of the dependents.

### 4. Cross-boundary communication uses explicit types

When data crosses a component boundary, it must be expressed as an explicit, stable type:

| Pattern | Use for |
|---------|---------|
| **Interface / abstract type** | Synchronous service calls |
| **DTO / value object** | Data passing between components |
| **Domain event / message** | Asynchronous communication |

Never pass internal domain entities across boundaries. The receiving component should not
need to understand the sender's internal model.

### 5. Boundary violations are caught automatically

Boundary rules must be enforced by tooling, not code review.

| Stack | Tooling |
|-------|---------|
| JS / TS | ESLint `import/no-restricted-paths`, `eslint-plugin-boundaries` |
| Python | `import-linter`, `pylint` with custom rules |
| Java / Kotlin | ArchUnit |
| Go | `depguard`, `go-arch-lint` |
| .NET | ArchUnitNET — see `plain-dotnet-guardrails` for specifics |

---

## Applicability

| Project type | Apply? | Notes |
|---|---|---|
| Backend with multiple domains | Yes — strictly | Core use case for this principle |
| Backend with a single domain | Yes — lightly | At minimum, separate infra from domain |
| Frontend application | Yes | Separate features/modules; avoid cross-feature imports |
| CLI tool | Partial | Separate commands from core logic |
| Library / SDK | Yes — strictly | Public API surface is the contract with consumers |
| Microservice (single responsibility) | Partial | Internal layers still benefit from direction rules |

---

## What Does Not Belong Here

- **.NET-specific Modular Monolith patterns** (schema isolation, Scrutor scanning) → see `plain-dotnet-guardrails`
- **Architecture test implementation details** → see `architecture-enforcement.md`
- **Event bus / messaging infrastructure** → see `observability.md` or stack-specific guardrails
