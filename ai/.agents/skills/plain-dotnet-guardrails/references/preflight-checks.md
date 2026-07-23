# Pre-Flight Checks

Standard pre-flight checks that every Plain Concepts skill performs before scaffolding. All checks are performed using the agent's file listing and reading tools ÔÇö no bash scripts.

## Check 1: Solution Detection

**Who runs it:** All skills except `plain-dotnet-guardrails` (reference-only).

**How:** List `*.slnx` files in the current directory.

**If none found:** Halt with:
> "No .slnx file found. Run this skill from the project root directory where the .slnx file lives."

**If found:** Extract the project name from the filename:
- `MyApp.slnx` ÔåÆ `__PROJECT_NAME__` = `MyApp`
- If multiple `.slnx` files exist, present a list and ask the user to confirm which one.

---

## Check 2: Architecture Detection

**Who runs it:** `plain-dotnet-module`, `plain-dotnet-use-cases`.

**How:** List directories matching `src/*.BuildingBlocks.Architecture.VSA.CQS`.

**If none found:** Halt with:
> "VSA+CQS architecture not applied. Run plain-dotnet-arch-vsa first."

**If found:** Confirm the project name prefix from the folder name (e.g., `src/MyApp.BuildingBlocks.Architecture.VSA.CQS` ÔåÆ `__PROJECT_NAME__` = `MyApp`).

---

## Check 3: Module Detection

**Who runs it:** `plain-dotnet-use-cases` only.

**How:** Read the `.slnx` XML, find all `<Project Path="..."/>` elements where `Path` contains `/Modules/`. Extract module names from the path segments.

**If none found:** Halt with:
> "No modules found. Run plain-dotnet-module first."

**If one found:** Use it automatically ÔÇö no need to ask.

**If multiple found:** Present a numbered list:
```
Found modules:
  1. Orders
  2. Products
  3. Customers
Which module should the use cases be added to? (enter number)
```

---

## Check 4: Duplicate Check

**Who runs it:** `plain-dotnet-module`, `plain-dotnet-use-cases`.

**How:**
- `plain-dotnet-module`: Check if `src/modules/{ModuleName}/{ProjectName}.Modules.{ModuleName}/` already exists.
- `plain-dotnet-use-cases`: Check if `src/modules/{ModuleName}/{ProjectName}.Modules.{ModuleName}/Features/{EntityName}/` already exists.

**If found (plain-dotnet-module):** Warn and ask:
> "Module {ModuleName} already exists. Use plain-dotnet-use-cases to add entities to it. Proceed anyway? (yes/no)"

**If found (plain-dotnet-use-cases):** Warn and ask:
> "Features/{EntityName}/ already exists in module {ModuleName}. Overwriting will replace existing use cases. Proceed? (yes/no)"

---

## Check 5: Prerequisite Tools

**Who runs it:** `plain-dotnet-shell` (all skills assume shell was successful).

**How:** Run `dotnet --version` and `git --version`.

**dotnet version:** Must output `10.x.x` or higher. If lower or missing, halt with:
> "dotnet SDK 10.0.100 or higher required. Install from https://dot.net/download"

**git version:** Must succeed (any version). If missing, halt with:
> "git is required. Install from https://git-scm.com ÔÇö or pass --no-git to skip git initialization."
