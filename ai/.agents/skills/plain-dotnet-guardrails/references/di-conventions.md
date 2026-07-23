# DI Conventions (Scrutor-Based Assembly Scanning)

Plain Concepts uses Scrutor for convention-based DI registration. Manual `services.AddScoped<IFoo, Foo>()` calls are not used for handlers, validators, or modules ÔÇö everything is discovered by convention.

## Key Registration Extensions

### `AddHandlersFromAssembly(assembly)`

```csharp
builder.Services.AddHandlersFromAssembly(typeof({Module}Module).Assembly);
```

- Registers all `IAppCommandHandler<,>` and `IAppQueryHandler<,>` implementations from the assembly.
- **MUST** be called with `typeof({Module}Module).Assembly` ÔÇö not `Assembly.GetExecutingAssembly()`.
- Reason: `Assembly.GetExecutingAssembly()` returns the assembly of the calling code (often the Server), not the module. The module assembly must be explicitly loaded.
- Called inside `{Module}Module.Add(builder)` (not in `Program.cs`).

### `builder.AddVsaCqsArchitecture()`

```csharp
builder.AddVsaCqsArchitecture();
```

- Registers the 4 pipeline decorators in the correct order: Logging ÔåÆ Validation ÔåÆ Caching ÔåÆ InvalidateCaching.
- Called **once** in `Program.cs` after `AddApiServices()`.
- Do not call this inside a module's `Add()` method ÔÇö it is a global cross-cutting concern.

### `RegisterAppModules()`

```csharp
builder.RegisterAppModules();
```

- Scans all loaded assemblies for `IModule` implementations.
- Calls each module's `Add(builder)` in the order they are discovered.
- Called in `Program.cs` after `AddVsaCqsArchitecture()`.
- Modules self-register by implementing `IModule` ÔÇö no manual enumeration required.

### `AddModulePersistence<TDbContext>(connectionName)`

```csharp
services.AddModulePersistence<{Module}DbContext>(Constants.Infrastructure.Components.Database);
```

- Wires the per-module `DbContext` to Aspire's connection string injection.
- Registers the domain event interceptor (`PublishDomainEventsInterceptor`).
- Uses `AddSqlServerDbContext<T>` (or `AddNpgsqlDbContext<T>` for PostgreSQL).
- Source: `BuildingBlocks/Infrastructure/Persistence/ModulePersistenceExtensions.cs`.
- Called inside `{Module}Module.Add(builder)`.

## Pipeline Decorator Registration Order

Order matters. Decorators wrap each other like Russian dolls ÔÇö outermost runs first:

```
Request
  ÔööÔöÇ LoggingDecorator          (1st ÔÇö logs start, captures duration)
       ÔööÔöÇ ValidationDecorator  (2nd ÔÇö runs FluentValidation; short-circuits on failure)
            ÔööÔöÇ CachingDecorator (3rd ÔÇö checks cache; short-circuits on hit)
                 ÔööÔöÇ Handler    (executes domain logic)
                      ÔööÔöÇ InvalidateCachingDecorator (4th ÔÇö runs after handler on commands)
```

- **LoggingDecorator** wraps everything ÔÇö captures total latency including validation.
- **ValidationDecorator** runs before domain logic ÔÇö invalid requests never reach the handler.
- **CachingDecorator** short-circuits before the handler on cache hits (queries only).
- **InvalidateCachingDecorator** runs after the handler on commands that implement `IInvalidateCacheRequest`.

## FluentValidation Registration

Validators are also registered via Scrutor:

```csharp
services.AddValidatorsFromAssembly(typeof({Module}Module).Assembly);
```

Called inside `{Module}Module.Add(builder)` alongside `AddHandlersFromAssembly`.

## Scrutor Scanning Pattern (for custom registrations)

```csharp
services.Scan(scan => scan
    .FromAssemblyOf<{Module}Module>()
    .AddClasses(classes => classes.AssignableTo<IMyService>())
    .AsImplementedInterfaces()
    .WithScopedLifetime());
```

Use this pattern for any service that doesn't fit the standard handler or validator conventions.
