# Token Reference

Master table of all `__TOKEN__` names used across Plain Concepts skills.

## Token Table

| Token | Replaces | Example | Used In |
|-------|----------|---------|---------|
| `__PROJECT_NAME__` | Solution/namespace root (PascalCase) | `MyApp` | plain-dotnet-shell, plain-dotnet-arch-vsa, plain-dotnet-module, plain-dotnet-use-cases |
| `__MODULE_NAME__` | Module name (PascalCase) | `Orders` | plain-dotnet-module, plain-dotnet-use-cases |
| `__ENTITY_NAME__` | Entity name (PascalCase) | `Product` | plain-dotnet-use-cases |
| `__ENTITY_NAME_PLURAL__` | Plural entity name (PascalCase) | `Products` | plain-dotnet-use-cases |
| `__ENTITY_NAME_LOWER__` | Entity name lowercase (routes, tables) | `product` | plain-dotnet-use-cases |
| `__MODULE_NAME_LOWER__` | Module name lowercase (routes, schema) | `orders` | plain-dotnet-module, plain-dotnet-use-cases |

## Token Substitution Rules

1. **Format:** Tokens are `SCREAMING_SNAKE_CASE` wrapped in double underscores ÔÇö e.g., `__PROJECT_NAME__`, `__MODULE_NAME__`, `__ENTITY_NAME__`.

2. **Scope:** Tokens appear in **two places**:
   - **Stub file content** ÔÇö inside `.cs`, `.csproj`, `.json`, and other file bodies
   - **Stub file names** ÔÇö in the filename itself (e.g., `__MODULE_NAME__Module.cs` ÔåÆ `OrdersModule.cs`)

3. **Substitution rule:** The agent performing substitution replaces **ALL occurrences** of each token before creating the file. No partial substitutions. No leftover tokens.

4. **Case sensitivity:** Tokens are case-sensitive. `__PROJECT_NAME__` Ôëá `__project_name__`. Always use SCREAMING_SNAKE_CASE.

5. **Derived tokens:** Some tokens are derived from a user-provided base name:
   - User provides `Orders` ÔåÆ `__MODULE_NAME__` = `Orders`, `__MODULE_NAME_LOWER__` = `orders`
   - User provides `Product` ÔåÆ `__ENTITY_NAME__` = `Product`, `__ENTITY_NAME_PLURAL__` = `Products`, `__ENTITY_NAME_LOWER__` = `product`
   - Pluralization: append `s` by default; agent asks the user to confirm if the word is irregular (e.g., `Category` ÔåÆ `Categories`)

6. **Validation:** After substitution, no `__TOKEN__` pattern should remain in any created file. Agents must scan their output for leftover tokens and fix before reporting success.
