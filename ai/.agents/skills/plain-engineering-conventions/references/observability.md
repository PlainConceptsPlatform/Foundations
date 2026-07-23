# Observability

Structured logging, distributed tracing, and metrics standards for Plain Concepts projects.

## Structured Logging

### Use Key-Value Context, Not String Interpolation

```
// Good — structured, queryable
logger.info("Product created", { productId: "abc-123", price: 42.00 })

// Bad — opaque string, not queryable
logger.info(f"Product abc-123 created with price 42.00")
```

Structured logs are machine-parseable. Observability platforms (Application Insights, Grafana,
Datadog) can filter, aggregate, and alert on structured fields.

### Prefer Platform/Standard Logging

Use the logging facility provided by your platform or standard library. Avoid adding third-party
logging frameworks unless they provide a clear, justified benefit.

| Language | Standard/platform logger |
|----------|------------------------|
| .NET | `ILogger<T>` (Microsoft.Extensions.Logging) |
| Java | SLF4J + Logback |
| Python | `logging` (standard library) |
| Go | `log/slog` (standard library, Go 1.21+) |
| TypeScript | `pino` or framework-native (NestJS Logger) |
| Rust | `tracing` crate |

### Log Levels

| Level | When to use | Examples |
|-------|-------------|---------|
| **Info** | Successful domain operations | "Product created", "Order shipped" |
| **Warning** | Expected domain errors, handled failures | "Product not found", "Validation failed" |
| **Error** | Unexpected failures, infrastructure errors | "Database connection lost", "Unhandled exception" |
| **Debug** | Detailed diagnostics (dev/troubleshooting) | "Cache key: {key}", "Query took {ms}ms" |

**Rule**: Domain validation failures are `Warning`, not `Error`. They are expected and handled.

### Zero-Allocation Log Templates

Where the language supports it, prefer compiled/source-generated log templates over runtime string
formatting:

- **.NET**: `LoggerMessage.Define` or `[LoggerMessage]` source generator — compiles templates at
  startup, zero per-call allocation.
- **Java**: SLF4J parameterized messages (`log.info("Created {}", id)`) — avoids string
  concatenation.
- **Rust**: `tracing` structured spans — compiled at build time.

## Automatic Handler Logging

Use decorators, middleware, or interceptors to log every command/query automatically:

- Handler type name
- Execution start time
- Execution duration (ms)
- Result status (success or error type)

This removes the need for manual start/end logging in every handler. Write handler-specific logs
only for business-relevant events beyond start/end/duration.

## Distributed Tracing (OpenTelemetry)

Adopt [OpenTelemetry](https://opentelemetry.io/) as the vendor-neutral standard for distributed
tracing and metrics.

### Traces and Spans

- Every incoming HTTP request creates a **trace**.
- Each significant operation (handler execution, database call, external API call) creates a
  **span** within that trace.
- Per-module instrumentation: each module registers its own trace source/activity source so spans are
  attributable to specific business capabilities.

### Metrics

- Use **counters** for discrete events (orders created, cache hits).
- Use **histograms** for distributions (request duration, payload size).
- Register metrics per module, not globally — enables per-module dashboards.

## What Never to Log

| Category | Examples | Risk |
|----------|---------|------|
| **Credentials** | Passwords, API keys, tokens, connection strings | Credential exposure |
| **PII** | Email addresses, phone numbers, IP addresses, names | Privacy/GDPR violation |
| **Full entities** | Entire domain objects, request/response bodies | Data leakage, log bloat |
| **Financial data** | Credit card numbers, bank accounts | PCI-DSS violation |

Log **identifiers** (IDs, correlation IDs, operation names) — never raw sensitive data.

## Per-Entity Diagnostic Messages

Each entity should have a dedicated diagnostics file with pre-defined log messages. This ensures
consistent log messages across the codebase and enables easy discovery of all log points for an
entity.

```
Diagnostics.Products
  ├── CreatingProduct(id)       → Info
  ├── ProductCreated(id)        → Info
  ├── ProductNotFound(id)       → Warning
  ├── ProductDeleted(id)        → Info
  └── ProductUpdateFailed(id)   → Error
```
