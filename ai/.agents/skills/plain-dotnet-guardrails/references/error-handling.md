# Error Handling (ErrorOr + ProblemDetails)

All Plain Concepts handlers use `ErrorOr<T>` for domain errors. Exceptions are for truly unexpected infrastructure failures only.

## Core Rule

**Handlers NEVER throw exceptions for domain errors.** Return `Error.*` values instead.

```csharp
// Correct
public async Task<ErrorOr<GetProductResponse>> Handle(
    GetProductQuery query, CancellationToken ct)
{
    var product = await _dbContext.Products.FindAsync(query.Id, ct);
    if (product is null)
        return ProductErrors.NotFound;

    return new GetProductResponse(product.Id, product.Name);
}

// Wrong ÔÇö do not throw domain exceptions
if (product is null)
    throw new ProductNotFoundException(query.Id);
```

## Error Factory Pattern

Each entity has a dedicated `{Entity}Errors.cs` file with static `Error` properties:

```csharp
public static class ProductErrors
{
    public static readonly Error NotFound =
        Error.NotFound("Product.NotFound", "Product not found");

    public static readonly Error AlreadyExists =
        Error.Conflict("Product.AlreadyExists", "Product already exists");

    public static readonly Error NameTooLong =
        Error.Validation("Product.NameTooLong", "Product name exceeds maximum length");
}
```

Convention: error code format is `{Entity}.{PascalCaseDescription}`.

## HTTP Status Mapping

Endpoints resolve `ErrorOr<T>` results via `result.Match(successResult, ApiResults.Problem)`.

`ApiResults.Problem` converts `ErrorOr` errors to RFC 7807 `ProblemDetails` automatically:

| `Error.*` type | HTTP Status |
|---|---|
| `Error.Validation(*)` | 400 Bad Request |
| `Error.Unauthorized(*)` | 401 Unauthorized |
| `Error.Forbidden(*)` | 403 Forbidden |
| `Error.NotFound(*)` | 404 Not Found |
| `Error.Conflict(*)` | 409 Conflict |
| `Error.Failure(*)` | 500 Internal Server Error |

```csharp
// Endpoint pattern
app.MapGet("/api/orders/products/{id}", async (Guid id, IAppQueryHandler<GetProductQuery, GetProductResponse> handler) =>
{
    var result = await handler.Handle(new GetProductQuery(id), default);
    return result.Match(
        product => Results.Ok(product),
        errors => ApiResults.Problem(errors));
})
.WithName("GetProduct")
.Produces<GetProductResponse>()
.ProducesProblem(StatusCodes.Status404NotFound);
```

## FluentValidation Integration

`ValidationDecorator` runs `IValidator<TCommand>` before the handler. If validation fails, the handler is never called:

```csharp
// Validator
public class CreateProductValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Price).GreaterThan(0);
    }
}
```

When validation fails, `ValidationDecorator` returns `Error.Validation` with **all** FluentValidation failure messages ÔÇö not just the first. This produces a 400 response with a `ProblemDetails` body listing all field errors.

## Multiple Errors

`ErrorOr<T>` supports multiple errors. Use `Error.Validation` with explicit codes when collecting multiple validation failures manually (outside FluentValidation):

```csharp
var errors = new List<Error>();
if (string.IsNullOrEmpty(command.Name)) errors.Add(ProductErrors.NameRequired);
if (command.Price <= 0) errors.Add(ProductErrors.InvalidPrice);
if (errors.Count > 0) return errors;
```
