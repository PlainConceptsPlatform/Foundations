# Aspire Conventions

Resource naming, connection string patterns, and Aspire configuration conventions for Plain Concepts skills.

## Resource Name Constants

All resource names are declared as constants in `{ProjectName}.Constants.Infrastructure.Components`:

```csharp
public static class Components
{
    public static class Database
    {
        public const string SqlServer = "sqlserver";
        public const string Postgres  = "postgres";
    }

    public const string Cache  = "redis";
    public const string Host   = "api";   // The Server project's logical name in Aspire
}
```

- Use `Components.Database.SqlServer` (or `.Postgres`) when calling `AddModulePersistence<T>()`.
- Use `Components.Cache` when calling `builder.AddRedis(...)`.
- **Never hardcode** resource name strings ÔÇö always use the constant.

## Aspire Project Class Naming Pitfall

**Critical:** Dots in a project name become underscores in the Aspire `Projects.*` class name.

| Project name | Aspire class |
|---|---|
| `MyApp.Server` | `Projects.MyApp_Server` |
| `MyApp.AppHost` | `Projects.MyApp_AppHost` |
| `MyApp.Modules.Orders` | `Projects.MyApp_Modules_Orders` |

Always use the underscore form when referencing projects in `AppHost`:

```csharp
// Correct
var api = builder.AddProject<Projects.MyApp_Server>("api");

// Wrong ÔÇö compile error
var api = builder.AddProject<Projects.MyApp.Server>("api");
```

## Connection Strings

Aspire injects connection strings at runtime. Do **NOT** hardcode connection strings in `appsettings.json`.

```csharp
// AppHost ÔÇö declare the resource
var sql = builder.AddSqlServer(Components.Database.SqlServer)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithDataVolume();

var api = builder.AddProject<Projects.MyApp_Server>(Components.Host)
    .WithReference(sql)
    .WaitFor(sql);

// Module ÔÇö consume the connection string
// (called inside module's Add() via AddModulePersistence<T>)
services.AddModulePersistence<OrdersDbContext>(Components.Database.SqlServer);
```

## Container Persistence

Always use `WithLifetime(ContainerLifetime.Persistent)` + `WithDataVolume()` on stateful resources:

```csharp
builder.AddSqlServer(Components.Database.SqlServer)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithDataVolume("myapp-sql-data");
```

This ensures data survives container restarts during local development.

## Redis (Optional ÔÇö per module)

```csharp
// AppHost ÔÇö add Redis if any module uses caching
var redis = builder.AddRedis(Components.Cache)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithRedisCommander();    // ÔåÉ RedisCommander UI at http://localhost:{port}

var api = builder.AddProject<Projects.MyApp_Server>(Components.Host)
    .WithReference(sql)
    .WithReference(redis)    // ÔåÉ add .WithReference(redis) when Redis is used
    .WaitFor(sql);
```

`plain-dotnet-module` asks: "Will you use Redis for caching? (y/n)". If yes, adds the Redis resource to `AppHost.cs` (if not already present) and adds `.WithReference(redis)` to the API project reference.

## Keycloak (Auth ÔÇö future)

Declared as `builder.AddKeycloak(...)` with the Aspire Keycloak integration package. Reserved for Phase 2 (Auth skill). Do not add in Phase 1 skills.

## Adding New Aspire Resources (checklist for plain-dotnet-module with Redis)

1. Open `src/hosts/{ProjectName}.AppHost/AppHost.cs`.
2. Check if `builder.AddRedis(Components.Cache)` is already present.
3. If not: add it with `WithLifetime(ContainerLifetime.Persistent)` and `.WithRedisCommander()`.
4. Add `.WithReference(redis)` to the API project's `AddProject` call.
5. Run `dotnet build` on the AppHost project to verify.
