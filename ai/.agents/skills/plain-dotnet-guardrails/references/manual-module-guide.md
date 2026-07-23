# Manual Module Guide

Step-by-step guide to add a Plain Concepts module manually, without invoking `plain-dotnet-module`. Use this when the skill is unavailable or when you need precise control over the scaffolding.

## Prerequisites

- `plain-dotnet-shell` has been run: a `.slnx` file exists in the current directory.
- `plain-dotnet-arch-vsa` has been run: `src/{ProjectName}.BuildingBlocks.Architecture.VSA.CQS/` exists.
- You know the module name (e.g., `Orders`) and the project name (from the `.slnx` filename, e.g., `MyApp`).

---

## Steps

### 1. Create the 4 project directories

```
src/modules/{Module}/{ProjectName}.Modules.{Module}/
src/modules/{Module}/{ProjectName}.Modules.{Module}.Contracts/
tests/modules/{Module}/{ProjectName}.Modules.{Module}.UnitTests/
tests/modules/{Module}/{ProjectName}.Modules.{Module}.FunctionalTests/
```

### 2. Create the 4 `.csproj` files

Each project needs a `.csproj` with appropriate SDK and package references. Follow the permitted dependency rules from `arch-rules.md`:

**`{ProjectName}.Modules.{Module}.csproj`** (main module):
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="../../../buildingblocks/{ProjectName}.BuildingBlocks/{ProjectName}.BuildingBlocks.csproj" />
    <ProjectReference Include="../../../buildingblocks/{ProjectName}.BuildingBlocks.Architecture.VSA.CQS/{ProjectName}.BuildingBlocks.Architecture.VSA.CQS.csproj" />
    <ProjectReference Include="../{ProjectName}.Modules.{Module}.Contracts/{ProjectName}.Modules.{Module}.Contracts.csproj" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" />
    <PackageReference Include="FluentValidation" />
    <PackageReference Include="ErrorOr" />
  </ItemGroup>
</Project>
```

**`{ProjectName}.Modules.{Module}.Contracts.csproj`** (contracts only ÔÇö minimal deps):
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <!-- No project references ÔÇö contracts are standalone -->
</Project>
```

### 3. Add projects to the solution

```bash
dotnet sln {ProjectName}.slnx add src/modules/{Module}/{ProjectName}.Modules.{Module}/{ProjectName}.Modules.{Module}.csproj
dotnet sln {ProjectName}.slnx add src/modules/{Module}/{ProjectName}.Modules.{Module}.Contracts/{ProjectName}.Modules.{Module}.Contracts.csproj
dotnet sln {ProjectName}.slnx add tests/modules/{Module}/{ProjectName}.Modules.{Module}.UnitTests/{ProjectName}.Modules.{Module}.UnitTests.csproj
dotnet sln {ProjectName}.slnx add tests/modules/{Module}/{ProjectName}.Modules.{Module}.FunctionalTests/{ProjectName}.Modules.{Module}.FunctionalTests.csproj
```

### 4. Create `{Module}Module.cs` implementing `ModuleBase`

```csharp
public sealed class {Module}Module : ModuleBase
{
    public override void Add(IHostApplicationBuilder builder)
    {
        builder.Services.AddHandlersFromAssembly(typeof({Module}Module).Assembly);
        builder.Services.AddValidatorsFromAssembly(typeof({Module}Module).Assembly);
        builder.Services.AddModulePersistence<{Module}DbContext>(
            Constants.Infrastructure.Components.Database.SqlServer);
        builder.Services.AddSingleton<{Module}Instrumentation>();
    }

    public override void Initialize(IApplicationBuilder app)
    {
        if (app.ApplicationServices.GetRequiredService<IHostEnvironment>().IsDevelopment())
        {
            using var scope = app.ApplicationServices.CreateScope();
            scope.ServiceProvider.GetRequiredService<{Module}DbContext>().Database.Migrate();
        }
    }
}
```

### 5. Create `{Module}DbContext`

```csharp
public sealed class {Module}DbContext(DbContextOptions<{Module}DbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("{module_lower}");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof({Module}DbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
```

### 6. Create `{Module}DbContextDesignTimeFactory`

Allows `dotnet ef migrations` to work without Aspire running:

```csharp
public sealed class {Module}DbContextDesignTimeFactory : IDesignTimeDbContextFactory<{Module}DbContext>
{
    public {Module}DbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<{Module}DbContext>();
        optionsBuilder.UseSqlServer(
            "Server=localhost;Database={ProjectName};Trusted_Connection=True;TrustServerCertificate=True;");
        return new {Module}DbContext(optionsBuilder.Options);
    }
}
```

### 7. Create Contracts namespace marker

```
src/modules/{Module}/{ProjectName}.Modules.{Module}.Contracts/Public/Events/Marker.cs
```

```csharp
namespace {ProjectName}.Modules.{Module}.Contracts.Public.Events;
// This namespace is intentionally empty ÔÇö events will be added here as the module grows.
```

### 8. Add module project reference to Server

In `src/root/{ProjectName}.Server/{ProjectName}.Server.csproj`:

```xml
<ItemGroup>
  <ProjectReference Include="..\..\modules\{Module}\{ProjectName}.Modules.{Module}\{ProjectName}.Modules.{Module}.csproj" />
</ItemGroup>
```

This is required for `RegisterAppModules()` to discover the module at startup.

### 9. Verify the build

```bash
dotnet build {ProjectName}.slnx
```

Fix any compiler errors before proceeding.

### 10. Add EF Core migration

```bash
dotnet ef migrations add InitialCreate \
  --project src/modules/{Module}/{ProjectName}.Modules.{Module} \
  --startup-project src/root/{ProjectName}.Server
```

See `modular-monolith-guide.md` for the full migration guide.
