# Vertical Slice Architecture + CQS

Feature-per-folder organization and Command/Query Separation rules for Plain Concepts projects.

## Applicability

**Recommended for backend services and APIs with meaningful business logic.** Projects with
minimal domain complexity ÔÇö CLIs, thin proxies, frontend applications, or single-purpose
microservices ÔÇö may use a simpler flat module structure. Apply VSA where the alternative
would be a growing, hard-to-navigate flat list of files.

## Vertical Slicing

Group all code for a single use case together in one folder. A use case slice contains everything
needed for that operation ÔÇö endpoint, command/query, handler, validation, request/response types,
and error definitions.

```
Features/
  {Entity}/
    UseCases/
      Create/
        Create{Entity}Endpoint       ÔåÉ HTTP route definition
        Create{Entity}Command        ÔåÉ Command object (input)
        Create{Entity}Handler        ÔåÉ Business logic
        Create{Entity}Validator      ÔåÉ Input validation rules
        Create{Entity}Request        ÔåÉ HTTP request body DTO
        Create{Entity}Response       ÔåÉ HTTP response body DTO
      Get/
        ...
      GetAll/
        ...
      Update/
        ...
      Delete/
        ...
    {Entity}                         ÔåÉ Domain entity
    {Entity}Errors                   ÔåÉ Error factory (domain error definitions)
    Diagnostics.{EntityPlural}       ÔåÉ Structured log message definitions
```

### Why Vertical Slicing?

- **Locality**: All related code lives together ÔÇö no jumping between `Controllers/`, `Services/`,
  `Repositories/`, `Models/` folders scattered across the project.
- **Independence**: Changing one use case touches one folder. No "shared service" that 20 use cases
  depend on.
- **Delete-friendly**: Removing a feature means deleting one folder. No orphaned code.

## Command/Query Separation (CQS)

Commands and queries are distinct types. Never mix reads and writes in the same handler.

| Type | Purpose | Side effects | Returns |
|------|---------|--------------|---------|
| **Command** | Mutate state (create, update, delete) | Yes | Result with outcome or errors |
| **Query** | Read state | None | Data projection (DTO/response) |

### Rules

1. **Commands return results, not void.** Return a result type wrapping either the success value or
   domain errors ÔÇö never `void`, never throw for domain failures.
2. **Queries are side-effect-free.** A query must not modify state, send emails, trigger events, or
   cause any observable change.
3. **One handler per command/query.** Each command or query has exactly one handler. No "god handler"
   that processes multiple operations.
4. **Handlers are internal/sealed.** Handlers are implementation details ÔÇö they must not be public or
   referenced across module boundaries.

## Layer Dependency Rules

Express these as "who can reference whom" ÔÇö regardless of how layers are packaged.

### Permitted

| From | To | Rationale |
|------|----|-----------|
| Host/API layer | Shared infrastructure, Architecture layer, Modules | Wires everything at startup |
| Architecture layer | Shared infrastructure | Extends base abstractions |
| Module | Shared infrastructure, Architecture layer | Uses shared contracts and infra |
| Module | Its own Contracts package | Implements its public surface |
| Unit tests | Module under test | Tests domain logic |
| Integration tests | Host/API layer, Shared test utilities | Spins up the full stack |

### Forbidden

| From | To | Why |
|------|----|-----|
| Module A | Module B (implementation) | Breaks bounded context isolation ÔÇö use Contracts |
| Architecture layer | Any module | Architecture is shared; must not depend on business logic |
| Contracts package | Implementation package | Contracts are consumed by others; no circular deps |

## Language Examples

### .NET

Commands implement `ICommand<ErrorOr<T>>`, queries implement `IQuery<ErrorOr<T>>`. Handlers are
`file sealed class` implementing `IAppCommandHandler<,>` or `IAppQueryHandler<,>`. MediatR-style
dispatch via interface injection.

### Java (Spring)

Command/query objects as POJOs. Handlers annotated with `@Service` or `@Component`, discovered via
component scan. CQRS can be implemented with dedicated `CommandHandler<C, R>` and
`QueryHandler<Q, R>` interfaces. Spring Modulith enforces module boundaries.

### TypeScript (NestJS)

Commands/queries as classes. Handlers decorated with `@CommandHandler()` / `@QueryHandler()`. The
`@nestjs/cqrs` module provides bus-based dispatch. Module isolation via NestJS modules with
explicit `exports`.

### Go

Command/query structs. Handler functions or methods on a service struct. Module isolation via Go
packages with unexported (lowercase) types for internals. No framework needed ÔÇö use plain
interfaces.
