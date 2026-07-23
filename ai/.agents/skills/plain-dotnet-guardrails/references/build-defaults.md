# Build Defaults Convention (`Directory.Build.props`)

## What to look for

Every .NET solution should have a `Directory.Build.props` file at the repository root. This file is automatically imported into every project in the directory tree, eliminating property repetition across `.csproj` files and ensuring consistent compiler settings throughout the solution.

**Flag as an opportunity to align if:**
- No `Directory.Build.props` exists at the repository root
- Individual `.csproj` files each declare `TargetFramework`, `Nullable`, or `LangVersion` independently (duplication)
- `TreatWarningsAsErrors` is absent or set to `false`
- `EnforceCodeStyleInBuild` is absent (means `.editorconfig` style rules are only IDE suggestions, not CI gates)
- `EnableNETAnalyzers` is absent or `false`
- `Nullable` is not enabled

## Why this convention exists

`Directory.Build.props` (import point: early, before SDK defaults) and `Directory.Build.targets` (import point: late, after NuGet targets) provide a single authoritative source of truth for build configuration. When properties are scattered across individual project files, settings diverge over time ÔÇö one project enables nullable, another doesn't; one treats warnings as errors, another ignores them silently.

| File | Import point | Use for |
|------|-------------|---------|
| `Directory.Build.props` | Early (before SDK defaults) | Properties that configure the SDK |
| `Directory.Build.targets` | Late (after NuGet targets) | Custom build targets, post-build actions |

## Reference configuration

A well-configured `Directory.Build.props` for a modern .NET solution:

```xml
<Project>
  <PropertyGroup>
    <!-- Framework & Language -->
    <TargetFramework>net10.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>

    <!-- Code quality ÔÇö all three enforce style/analysis at build time -->
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <EnableNETAnalyzers>true</EnableNETAnalyzers>
    <AnalysisLevel>latest</AnalysisLevel>

    <!-- Source generation ÔÇö exposes generated files in obj/ for debugging -->
    <EmitCompilerGeneratedFiles>true</EmitCompilerGeneratedFiles>
  </PropertyGroup>

  <!-- CI-only: reproducible builds on GitHub Actions -->
  <PropertyGroup Condition="'$(GITHUB_ACTIONS)' == 'true'">
    <ContinuousIntegrationBuild>true</ContinuousIntegrationBuild>
  </PropertyGroup>
</Project>
```

## Property explanations

**`LangVersion=latest`** ÔÇö automatically uses the latest C# version supported by the installed SDK. Never pin to a specific number; you'll miss new features unnecessarily.

**`Nullable=enable`** ÔÇö enables nullable reference types. One of the highest-value safety features in modern C#: compile-time warnings for potential null dereferences instead of runtime `NullReferenceException`.

**`TreatWarningsAsErrors=true`** ÔÇö turns all warnings into errors. Without this, warnings accumulate silently and are never fixed. Pair with `<NoWarn>` for intentional suppression of specific warnings:
```xml
<NoWarn>$(NoWarn);CS1591</NoWarn>  <!-- suppress missing XML docs -->
```

**`EnforceCodeStyleInBuild=true`** ÔÇö causes `.editorconfig` style rules to produce build errors/warnings rather than just IDE squiggles. This makes code style enforceable in CI without relying on developer discipline.

**`AnalysisLevel=latest`** ÔÇö enables the newest generation of Roslyn code quality rules as soon as they're available in the SDK.

**`EmitCompilerGeneratedFiles=true`** ÔÇö writes source-generated files (e.g., from `System.Text.Json`, `RegexGenerator`, `LoggerMessage`) into `obj/` so they can be inspected. Harmless and very helpful for debugging generators.

## Multi-level merging

By default MSBuild stops scanning upward after finding the first `Directory.Build.props`. To support per-folder overrides that also inherit from the root, the inner file must explicitly import the parent:

```xml
<!-- tests/Directory.Build.props -->
<Project>
  <Import Project="$([MSBuild]::GetPathOfFileAbove(
      'Directory.Build.props',
      '$(MSBuildThisFileDirectory)../'))"
    Condition="'' != $([MSBuild]::GetPathOfFileAbove(
      'Directory.Build.props',
      '$(MSBuildThisFileDirectory)../'))" />

  <PropertyGroup>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>
</Project>
```

## Overriding in individual projects

Settings from `Directory.Build.props` are defaults. Any project can override them:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <!-- This project targets multiple frameworks -->
    <TargetFrameworks>net10.0;netstandard2.0</TargetFrameworks>
    <!-- Disable TreatWarningsAsErrors for a legacy/generated project -->
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Property not taking effect | Another file overrides it lower in the import chain | Run `dotnet msbuild /pp:preprocessed.xml MyProj.csproj` to see the merged result |
| File silently ignored on Linux/macOS | Filename casing mismatch | Ensure exact casing: `Directory.Build.props` (capital B and P) |
| Visual Studio not picking up changes | Stale solution cache | Close and reopen the solution, or right-click ÔåÆ Reload Project |
