# EditorConfig Conventions

## What to look for

Every .NET solution should have a `.editorconfig` file at the repository root with `root = true`. When paired with `EnforceCodeStyleInBuild=true` in `Directory.Build.props`, it turns style rules into CI-enforced build constraints ÔÇö not just IDE suggestions.

**Flag as an opportunity to align if:**
- No `.editorconfig` exists at the repository root
- `root = true` is absent (editors may silently inherit rules from parent directories)
- `EnforceCodeStyleInBuild=true` is not set in `Directory.Build.props` (style rules are IDE-only, not CI-enforced)
- Naming rules for interfaces (`I` prefix) or types (PascalCase) are absent
- `TreatWarningsAsErrors=true` is set in `Directory.Build.props` but `.editorconfig` rules use `error` severity across the board (risks blocking builds on new style rules in SDK updates)

## Why this convention exists

`.editorconfig` configures two distinct categories:

1. **Editor formatting** ÔÇö indentation, line endings, charset, trailing whitespace. These apply in any editor that supports EditorConfig.
2. **.NET / C# code style** ÔÇö language rules (var vs explicit types, expression bodies, pattern matching, etc.) and Roslyn naming rules. These become build constraints when `EnforceCodeStyleInBuild=true` is active.

Without a committed `.editorconfig`, style decisions are per-developer and per-IDE configuration, making diffs noisy and reviews harder.

## Key structural elements

### `root = true`

Put `root = true` at the top of the repository-root `.editorconfig`. This stops editors from searching parent directories for additional `.editorconfig` files. Sub-directories can have their own files to override specific rules.

### Severity levels

| Severity | Effect |
|----------|---------|
| `none` | Rule disabled |
| `silent` / `refactoring` | Available as code fix, no squiggle |
| `suggestion` | Blue squiggle, Quick Fix available |
| `warning` | Yellow squiggle; **build warning** when `EnforceCodeStyleInBuild=true` |
| `error` | Red squiggle; **build error** ÔÇö blocks CI |

Use `warning` for style preferences that matter but aren't hard invariants. Reserve `error` for rules you are certain should never be broken.

## Recommended baseline

```ini
root = true

# All files
[*]
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
indent_style = space
indent_size = 4

# C# and VB
[*.{cs,vb}]

#### Naming rules ####

# Interfaces: IPascalCase
dotnet_naming_rule.interface_should_begin_with_i.symbols  = interface
dotnet_naming_rule.interface_should_begin_with_i.style    = begins_with_i
dotnet_naming_rule.interface_should_begin_with_i.severity = warning

dotnet_naming_symbols.interface.applicable_kinds          = interface
dotnet_naming_symbols.interface.applicable_accessibilities = public, internal, private, protected

dotnet_naming_style.begins_with_i.required_prefix        = I
dotnet_naming_style.begins_with_i.capitalization         = pascal_case

# Types: PascalCase
dotnet_naming_rule.types_should_be_pascal_case.symbols  = types
dotnet_naming_rule.types_should_be_pascal_case.style    = pascal_case
dotnet_naming_rule.types_should_be_pascal_case.severity = warning

dotnet_naming_symbols.types.applicable_kinds            = class, struct, interface, enum
dotnet_naming_style.pascal_case.capitalization          = pascal_case

#### Organize usings ####
dotnet_sort_system_directives_first                     = true:warning
dotnet_separate_import_directive_groups                 = false:warning

#### Language rules ####

# File-scoped namespaces (C# 10+)
csharp_style_namespace_declarations                     = file_scoped:warning

# var preferences
csharp_style_var_for_built_in_types                     = true:warning
csharp_style_var_when_type_is_apparent                  = true:warning
csharp_style_var_elsewhere                              = true:warning

# Modern C# features
csharp_style_prefer_primary_constructors                = true:suggestion
csharp_style_prefer_collection_expression               = when_types_exactly_match:warning

# Expression-bodied members
csharp_style_expression_bodied_methods                  = true:warning
csharp_style_expression_bodied_properties               = true:warning
csharp_style_expression_bodied_constructors             = true:warning
csharp_style_expression_bodied_accessors                = true:warning

# Pattern matching
csharp_style_pattern_matching_over_is_with_cast_check  = true:warning
csharp_style_pattern_matching_over_as_with_null_check  = true:warning
csharp_style_prefer_switch_expression                   = true:warning

# Null checking
csharp_style_throw_expression                           = true:warning
csharp_style_conditional_delegate_call                  = true:warning

# Accessibility modifiers
dotnet_style_require_accessibility_modifiers            = omit_if_default:warning

# Parameter hygiene
dotnet_code_quality_unused_parameters                   = all:warning

# Namespace matches folder
dotnet_style_namespace_match_folder                     = true:suggestion

# Blank line hygiene
dotnet_style_allow_multiple_blank_lines_experimental    = false:warning

# Logging ÔÇö prefer [LoggerMessage] source generator
dotnet_diagnostic.CA1848.severity                       = warning
```

## Build-time enforcement

For `.editorconfig` styles to block a build, two conditions must both be true:

1. `<EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>` in `Directory.Build.props`
2. The rule severity is `warning` or `error` in `.editorconfig`

Check compliance without changing files:
```bash
dotnet format --verify-no-changes
```

## Sub-directory overrides

If a sub-project needs different rules (e.g., generated code), add a nested `.editorconfig` **without** `root = true`:

```ini
# src/Generated/.editorconfig  ÔÇö inherits from root, overrides specific rules
[*.cs]
dotnet_naming_rule.interface_should_begin_with_i.severity = none
dotnet_naming_rule.types_should_be_pascal_case.severity   = none
```

## Suppressing specific diagnostic IDs

When a rule needs to be suppressed project-wide with a documented rationale, prefer `.editorconfig` over `#pragma warning disable` scattered through source:

```ini
# IDE0051: Remove unused private members
# Suppressed because Marten uses reflection to discover Apply() methods
dotnet_diagnostic.IDE0051.severity = none
```
