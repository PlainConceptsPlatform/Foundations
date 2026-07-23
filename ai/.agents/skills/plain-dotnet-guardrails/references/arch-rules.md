# Architecture Rules (VSA+CQS)

Layer dependency rules for the Plain Concepts Vertical Slice Architecture + CQS pattern. These rules are enforced by Roslyn analyzers (MOD001ÔÇô005, CQS001) and ArchTests.

## Permitted Dependencies

| From | To | Why |
|------|----|-----|
| `{Name}.Server` | `{Name}.BuildingBlocks`, `{Name}.ServiceDefaults`, `{Name}.Constants`, `{Name}.BuildingBlocks.Architecture.VSA.CQS` | API host wires all layers |
| `{Name}.BuildingBlocks.Architecture.VSA.CQS` | `{Name}.BuildingBlocks` | Architecture extends shared infra |
| `{Name}.Modules.{M}` | `{Name}.BuildingBlocks`, `{Name}.BuildingBlocks.Architecture.VSA.CQS`, `{Name}.Constants` | Modules use shared infra |
| `{Name}.Modules.{M}` | `{Name}.Modules.{M}.Contracts` | Module uses its own contracts (one-way) |
| `{Name}.Modules.{M}.UnitTests` | `{Name}.Modules.{M}` | Unit tests test the module |
| `{Name}.Modules.{M}.FunctionalTests` | `{Name}.Server`, `{Name}.SharedFunctionalTests` | Functional tests spin up the full API |

## Forbidden Dependencies

Enforced by Roslyn analyzers MOD001ÔÇô005 and ArchTests:

- **Modules MUST NOT reference other modules directly** ÔÇö use `{Module}.Contracts` projects instead (MOD002: cross-vault injection)
- **`BuildingBlocks.Architecture.VSA.CQS` MUST NOT reference any module** ÔÇö the architecture layer is a shared utility, not a consumer of business logic
- **`{Name}.Contracts` projects MUST NOT reference implementation projects** ÔÇö contracts are consumed by others; they cannot depend on their own module's implementation
- **Handlers MUST be `file sealed class`** ÔÇö never `public class` or `internal class`; prevents accidental Scrutor scanning across module boundaries
- **Entities MUST NOT be exposed in HTTP responses** ÔÇö always use separate DTO/Response `record` types; never return EF entities directly from endpoints

## Analyzer Rules

| Rule | Name | Description |
|------|------|-------------|
| `MOD001` | Leaking Internals | A module's internal types (non-Contract) must not be referenced from outside the module |
| `MOD002` | Cross-Vault Injection | Module A must not inject types from Module B's implementation projects; only Contract interfaces are allowed |
| `MOD003` | Public Entities | EF entity classes must not appear in endpoint request/response types |
| `MOD004` | Sneaky Controllers | `[ApiController]` classes must not be placed inside module projects (use `IUseCase` pattern instead) |
| `MOD005` | DTO Leakage | DTOs defined in a module's implementation project must not be referenced from other modules |
| `CQS001` | Leaking CQS Types | `ICommand<T>`, `IQuery<T>`, and handler interfaces must not be referenced from outside the BuildingBlocks layer |

## Vertical Slice Structure

Each use case lives in a self-contained slice:

```
Features/
  {Entity}/
    UseCases/
      Create/
        Create{Entity}Endpoint.cs      ÔåÉ IUseCase
        Create{Entity}Command.cs       ÔåÉ ICommand<ErrorOr<Create{Entity}Response>>
        Create{Entity}Handler.cs       ÔåÉ file sealed class : IAppCommandHandler<,>
        Create{Entity}Validator.cs     ÔåÉ AbstractValidator<Create{Entity}Command>
        Create{Entity}Request.cs       ÔåÉ record (HTTP request body)
        Create{Entity}Response.cs      ÔåÉ record (HTTP response body)
      Get/
        ...
      GetAll/
        ...
      Update/
        ...
      Delete/
        ...
    {Entity}.cs                        ÔåÉ Domain entity (EF)
    {Entity}Errors.cs                  ÔåÉ ErrorOr error factory
    Diagnostics.{EntityPlural}.cs      ÔåÉ LoggerMessage.Define log methods
```
