# Error Handling (Result Pattern + RFC 7807)

Domain errors as values, not exceptions. HTTP errors as structured ProblemDetails.

## Core Rule

**Handlers never throw exceptions for domain errors.** Return error values instead.

Exceptions remain appropriate for truly unexpected infrastructure failures (database down, network
timeout, out of memory). Domain errors — "not found", "already exists", "validation failed" — are
expected outcomes, not exceptional conditions.

## Result Pattern

Every handler returns a result type that encapsulates either success or one or more errors.

```
Result<T> = Success(value: T) | Failure(errors: Error[])
```

The specific type name varies by ecosystem — what matters is the pattern:

| Language | Common types |
|----------|-------------|
| .NET | `ErrorOr<T>`, `Result<T>` (FluentResults), `OneOf<T, Error>` |
| Rust | `Result<T, E>` (built-in) |
| TypeScript | `neverthrow` Result, `fp-ts` Either, `oxide.ts` |
| Java | `vavr` Either, custom `Result<T>` sealed interface |
| Go | `(T, error)` return tuple (idiomatic) |
| Kotlin | `kotlin.Result`, Arrow `Either` |
| Python | `returns` Result, `result` library |

### Why Not Exceptions?

- **Control flow is explicit.** You can see from the return type that a function may fail.
- **Composable.** Results chain with `map`, `flatMap`, `match` — no try/catch nesting.
- **Testable.** Assert on the returned error value, not on caught exceptions.
- **Predictable performance.** No stack unwinding for expected domain outcomes.

## Error Factory Pattern

Each entity (or aggregate) owns its error definitions in a dedicated file:

```
{Entity}Errors
  ├── NotFound        → "Entity not found"
  ├── AlreadyExists   → "Entity already exists"
  ├── NameTooLong     → "Name exceeds maximum length"
  └── InvalidPrice    → "Price must be greater than zero"
```

### Rules

1. **Error code format**: `{Entity}.{PascalCaseDescription}` (e.g. `Product.NotFound`,
   `Order.AlreadyExists`).
2. **Errors are static/constant.** No dynamic construction with runtime data in the error
   definition — provide context via the result, not the error type.
3. **One file per entity.** All errors for `Product` live in `ProductErrors` — easy to discover,
   easy to test, easy to deprecate.

## HTTP Status Mapping

Map result errors to HTTP status codes consistently across all endpoints:

| Error category | HTTP Status | When |
|---------------|-------------|------|
| Validation | `400 Bad Request` | Input fails validation rules |
| Unauthorized | `401 Unauthorized` | Missing or invalid credentials |
| Forbidden | `403 Forbidden` | Authenticated but not permitted |
| Not Found | `404 Not Found` | Resource does not exist |
| Conflict | `409 Conflict` | Duplicate or state conflict |
| Unexpected | `500 Internal Server Error` | Unhandled or infrastructure failure |

### RFC 7807 — Problem Details for HTTP APIs

All error responses must follow [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807) (or its
successor RFC 9457). The response body is a JSON object with at minimum:

```json
{
  "type": "https://tools.ietf.org/html/rfc7807#section-3.1",
  "title": "Product not found",
  "status": 404,
  "detail": "No product exists with ID 42.",
  "instance": "/api/products/42"
}
```

Most web frameworks have built-in ProblemDetails support — use it.

## Validation

Input validation runs **before** the handler. If validation fails, the handler is never invoked.

### Rules

1. Use a dedicated validator per command (not inline in the handler).
2. Return **all** validation errors at once, not just the first.
3. Validation errors map to `400 Bad Request` with a ProblemDetails body listing every field error.

## Language Examples

### .NET

`ErrorOr<T>` as the result type. `AbstractValidator<T>` (FluentValidation) for input validation.
`ApiResults.Problem(errors)` converts to ProblemDetails. `result.Match(ok, ApiResults.Problem)`.

### Rust

`Result<T, AppError>` with a custom `AppError` enum. `thiserror` for error definitions. Axum's
`IntoResponse` trait converts errors to HTTP responses.

### TypeScript

`neverthrow` Result type. `zod` or `class-validator` for input validation. Express/Fastify
middleware maps `Err` variants to ProblemDetails JSON.

### Java (Spring)

Custom `Result<T>` sealed interface or vavr `Either`. Bean Validation (`@Valid`) for input.
`@ControllerAdvice` with `ProblemDetail` (Spring 6+) for HTTP error responses.

### Go

`(T, error)` return values. Custom error types implementing `error` interface. Middleware maps
sentinel errors to HTTP status codes.
