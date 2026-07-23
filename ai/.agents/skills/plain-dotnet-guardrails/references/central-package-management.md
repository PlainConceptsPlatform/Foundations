# Central Package Management Convention (`Directory.Packages.props`)

## What to look for

In a multi-project solution, Central Package Management (CPM) should be enabled via a `Directory.Packages.props` file at the repository root. CPM declares all NuGet package versions in a single authoritative file so individual `.csproj` files reference packages without a `Version` attribute.

**Flag as an opportunity to align if:**
- No `Directory.Packages.props` exists in a solution with more than one project
- Individual `.csproj` files each declare `Version="..."` on `<PackageReference>` items (version duplication)
- Different projects reference the same package at different versions (version drift)
- `ManagePackageVersionsCentrally` is absent or `false` in `Directory.Packages.props`

## Why this convention exists

Without CPM, version drift is inevitable as a solution grows. Different developers bump package versions in the projects they own, and over time the same package runs at different versions in different parts of the solution. CPM fixes this by making every version a single-point-of-truth decision, surfacing version bumps in code review, and making dependency audits trivial.

## Reference structure

```xml
<!-- Directory.Packages.props ÔÇö at the repository root -->
<Project>
  <PropertyGroup>
    <!-- Enable CPM for all projects in this directory tree -->
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <!-- Declare versions here ÔÇö no actual references, just versions -->
    <PackageVersion Include="Newtonsoft.Json"        Version="13.0.3" />
    <PackageVersion Include="Serilog.AspNetCore"     Version="8.0.3" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.4" />
  </ItemGroup>
</Project>
```

```xml
<!-- src/MyApp.Api/MyApp.Api.csproj ÔÇö Version attribute omitted -->
<Project Sdk="Microsoft.NET.Sdk.Web">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" />
    <PackageReference Include="Serilog.AspNetCore" />
  </ItemGroup>
</Project>
```

## Global package references

For packages every project should receive (e.g., analyzers), use `GlobalPackageReference` instead of repeating it in every project file:

```xml
<!-- Directory.Packages.props -->
<ItemGroup>
  <GlobalPackageReference Include="Roslynator.Analyzers" Version="4.12.9"
    IncludeAssets="runtime; build; native; contentfiles; analyzers"
    PrivateAssets="all" />
</ItemGroup>
```

## Transitive pinning

Prevent "diamond dependency" surprises by explicitly pinning a transitive dependency:

```xml
<PropertyGroup>
  <CentralPackageTransitivePinningEnabled>true</CentralPackageTransitivePinningEnabled>
</PropertyGroup>
<ItemGroup>
  <PackageVersion Include="System.Text.Json" Version="9.0.4" />
</ItemGroup>
```

## Version overrides (use sparingly)

If one project genuinely needs a different version:

```xml
<!-- In the project file only ÔÇö not in Directory.Packages.props -->
<PackageReference Include="Newtonsoft.Json" VersionOverride="12.0.1" />
```

To prevent abuse of this escape hatch, disable it at the solution level:

```xml
<PropertyGroup>
  <CentralPackageVersionOverrideEnabled>false</CentralPackageVersionOverrideEnabled>
</PropertyGroup>
```

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| **NU1008** | `<PackageReference>` has `Version` attribute while CPM is enabled | Remove `Version` from the `<PackageReference>` |
| **NU1604** | `<PackageVersion>` entry exists but has no `Version` | Add `Version="..."` to the `<PackageVersion>` |
| **NU1507** | Multiple package sources defined with CPM | Use package source mapping or a single source |
