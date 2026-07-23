# Logging Conventions

ILogger<T> usage guidelines for Plain Concepts .NET Modular Monolith skills.

## Framework Choice

**Use `ILogger<T>` (built-in ASP.NET Core).** No Serilog, NLog, or other third-party logging frameworks in generated stubs.

Rationale: `ILogger<T>` is zero-dependency, works with any sink (Application Insights, OpenTelemetry, console), and aligns with the no-extra-dependency philosophy of the skill suite.

## LoggingDecorator (Automatic)

`LoggingDecorator` runs automatically for every command and query (registered by `AddVsaCqsArchitecture()`). It logs:

- **Command/query type name** ÔÇö identifies which handler is executing
- **Execution start time** ÔÇö for correlation
- **Execution duration (ms)** ÔÇö performance observability
- **Result** ÔÇö either `Success` or the error type(s) returned

You do NOT need to add logging inside handlers for start/end/duration ÔÇö `LoggingDecorator` covers this.

## Log Levels

| Level | When to use | Examples |
|-------|-------------|---------|
| `Information` | Successful domain operations | "Product created", "Order updated", "User deleted" |
| `Warning` | Expected domain errors, validation failures | "Product not found (expected)", "Validation failed for CreateProduct" |
| `Error` | Unexpected exceptions, infrastructure failures | "Database connection failed", "Unhandled exception in handler" |
| `Debug` | Detailed diagnostic data (dev only) | "Cache key: {key}", "Query parameters: {params}" |
| `Trace` | Very detailed flow tracing (rarely used) | Step-by-step flow inside a complex algorithm |

Do NOT use `Error` for domain validation failures (those are `Warning` ÔÇö they are expected and handled).

## Per-Entity Diagnostic Messages

Each entity has a `Diagnostics.{EntityPlural}.cs` file using `LoggerMessage.Define` for zero-allocation structured logging:

```csharp
public static partial class Log
{
    [LoggerMessage(Level = LogLevel.Information, Message = "Creating {EntityName}")]
    public static partial void CreatingEntity(this ILogger logger, string entityName);

    [LoggerMessage(Level = LogLevel.Information, Message = "Product {ProductId} created successfully")]
    public static partial void ProductCreated(this ILogger logger, Guid productId);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Product {ProductId} not found")]
    public static partial void ProductNotFound(this ILogger logger, Guid productId);
}
```

**Why `LoggerMessage.Define` / source-generated partial methods?**
- Zero allocation ÔÇö log message templates are compiled at startup, not per-call
- Strongly typed parameters ÔÇö no `object[]` boxing
- IDE-friendly ÔÇö parameters are named, not positional

## Module-Level Diagnostics

Module startup/shutdown events are logged in `Infrastructure/Diagnostics/Diagnostics.cs`:

```csharp
public static partial class ModuleDiagnostics
{
    [LoggerMessage(Level = LogLevel.Information, Message = "{ModuleName} module started")]
    public static partial void ModuleStarted(this ILogger logger, string moduleName);

    [LoggerMessage(Level = LogLevel.Information, Message = "{ModuleName} module stopped")]
    public static partial void ModuleStopped(this ILogger logger, string moduleName);
}
```

Called in `{Module}Module.cs` `Add()` and on application shutdown.

## OpenTelemetry Instrumentation

Each module has `Infrastructure/Instrumentation.cs` with `ActivitySource` and `Meter` for distributed tracing and custom metrics:

```csharp
public sealed class OrdersInstrumentation : IDisposable
{
    public const string ActivitySourceName = "Orders";
    public const string MeterName = "Orders";

    public ActivitySource ActivitySource { get; } = new(ActivitySourceName);
    public Meter Meter { get; } = new(MeterName);

    public void Dispose()
    {
        ActivitySource.Dispose();
        Meter.Dispose();
    }
}
```

Registered as singleton: `services.AddSingleton<OrdersInstrumentation>()` in `{Module}Module.Add()`.

## What NOT to Log

- **Passwords, tokens, PII** ÔÇö never log sensitive data
- **Full entity objects** ÔÇö log IDs, not entire entity graphs
- **Every SQL query** ÔÇö use EF Core's built-in sensitive data logging only in Development environments via `EnableSensitiveDataLogging()` (conditional on environment)
