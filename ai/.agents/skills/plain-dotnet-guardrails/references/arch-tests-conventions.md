# Architecture Tests Convention

## What to look for

Every non-trivial .NET solution should have a dedicated architecture test project (typically named `<SolutionName>.ArchTests` or similar). This project encodes architectural invariants as executable tests so they are verified automatically on every build, rather than relying solely on code review.

**Flag as an opportunity to align if:**
- No architecture test project exists in the solution
- Architectural rules exist only in documentation or informal agreements
- There are duplicate `EventId` values among `[LoggerMessage]` attributes (silent log collision)
- Layer dependency rules exist in comments or README but are not programmatically enforced
- The project uses `Assert.True` / bare xunit assertions instead of `Shouldly` for arch tests

## Why this convention exists

Architectural invariants ÔÇö layer dependencies, naming conventions, duplicate IDs ÔÇö are the kind of rule that developers break accidentally rather than deliberately. Without programmatic enforcement, these violations accumulate silently and are only caught during code review (inconsistently) or at runtime (too late). Architecture tests catch structural mistakes at build time, before they reach review or production.

## Recommended stack

| Package | Role |
|---------|------|
| `xunit` | Test framework |
| `Shouldly` | Assertion library with clear, readable failure messages |
| `NetArchTest.eNhancedEdition` | Architecture rule engine (dependency, naming, layer checks) |

All three packages should be declared in `Directory.Packages.props` (CPM) so versions are centrally managed.

## Project references

The architecture test project should reference the assemblies it needs to scan:

- Core domain / building blocks assembly
- Application / server assembly

Add more references as new modules appear. The project should compile against the production assemblies directly (not via reflection-only loading) so refactors that break the architecture are caught immediately.

## Assembly scanning pattern (`ArchTestBase`)

Use a shared base class to provide the list of assemblies to scan. This keeps individual test classes focused on assertions:

```csharp
public abstract class ArchTestBase
{
    protected static readonly IEnumerable<Assembly> AssembliesToScan =
    [
        typeof(BuildingBlocksMarker).Assembly,
        typeof(ServerMarker).Assembly,
    ];
}
```

Adding a new production assembly means updating `ArchTestBase` in one place ÔÇö all existing tests automatically cover it.

## Mandatory test: duplicate log event IDs

The most commonly violated invariant in Aspire / structured logging projects is duplicate `EventId` values among `[LoggerMessage]` attributes. When two log statements share an `EventId`, structured logging sinks silently overwrite one with the other.

```csharp
public class LogEventIdTests : ArchTestBase
{
    [Fact]
    public void LoggerMessage_EventIds_Should_Be_Unique()
    {
        var eventIds = AssembliesToScan
            .SelectMany(a => a.GetTypes())
            .SelectMany(t => t.GetMethods())
            .SelectMany(m => m.GetCustomAttributes<LoggerMessageAttribute>())
            .Select(attr => attr.EventId)
            .ToList();

        eventIds.Should().OnlyHaveUniqueItems(
            "duplicate EventIds cause silent log collisions in structured sinks");
    }
}
```

## Conventions for new tests

- **One test class per concern**: `LayerDependencyTests`, `NamingConventionTests`, `LogEventIdTests`
- **Use Shouldly for all assertions** ÔÇö avoid bare `Assert.True(result.IsSuccessful)`; prefer `result.IsSuccessful.ShouldBeTrue("reason")`
- **Scan via `ArchTestBase.AssembliesToScan`** so new assemblies are automatically included
- **Test names follow `Subject_Should_Constraint`**: e.g., `LoggerMessage_EventIds_Should_Be_Unique`, `Handlers_Should_End_With_Handler`

## When to add more tests

Add a new architecture test whenever a rule would otherwise be enforced only by code review. Common candidates:

| Concern | Example rule |
|---------|-------------|
| Layer dependencies | `BuildingBlocks` must not reference `Server` |
| Naming conventions | Handler classes must end with `Handler` |
| Sealed types | Value objects must be `sealed` |
| Client usage | No direct `HttpClient` ÔÇö must use typed clients |
| Mediator handlers | All `IRequestHandler` implementations must be `internal` |
