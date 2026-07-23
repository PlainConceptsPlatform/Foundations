# Code Quality & Linting

Automated formatting and static analysis enforced in CI — not negotiable, not a code review concern.

## Principle

**Code style is not a matter of opinion — it is a matter of configuration.** Formatting debates
and style nitpicks in code reviews are waste. A linter and a formatter, properly configured and
enforced in CI, eliminate that waste entirely.

If a rule is important enough to comment on in a PR, it is important enough to automate.

---

## Rules

### 1. Formatter configured and enforced

Every project must have a formatter configured and version-controlled. Formatting must run
automatically — not manually.

- Formatter config lives in the repository root (e.g. `.editorconfig`, `prettier.config.js`, `pyproject.toml`)
- CI fails if files are not formatted
- "I forgot to format" is not a valid PR comment

### 2. Linter configured with project-specific rules

Default linter configs are not acceptable. Every project must explicitly configure its rules.

- Linter config is version-controlled in the repository
- Rules are consciously chosen — not inherited blindly from a generic preset
- Severity levels are explicit: errors block the build; warnings are tracked

### 3. CI gate — non-negotiable

Both formatter and linter run in CI and **block the pipeline on failure**.

- Lint step runs before build (fail fast — cheap check)
- A green pipeline means the code is formatted and lint-clean
- A pipeline that warns but does not fail on lint issues is misconfigured

### 4. No suppression without justification

Suppressing a lint rule inline is allowed only with a comment explaining why.

```
// This file is auto-generated — linting disabled intentionally
// eslint-disable-next-line no-console  (CLI entry point: console is the output)
```

Blanket suppression of entire files or rule categories without justification is not acceptable.

### 5. Pre-commit hooks — recommended

Pre-commit hooks provide fast feedback before code reaches CI. They are strongly recommended
but not mandatory (CI is the hard gate; hooks are a convenience).

- Use `husky` + `lint-staged` (JS/TS), `pre-commit` (Python), or equivalent
- Hooks should run formatter and linter on staged files only (fast)
- Hooks must never be skipped silently — if skipped, it must be intentional (`--no-verify` with reason)

---

## Tooling by Stack

These are informational examples — not prescriptions. Use what fits your ecosystem.

| Stack | Formatter | Linter / Static Analysis |
|-------|-----------|--------------------------|
| **JS / TS** | Prettier | ESLint |
| **Python** | Black or Ruff | Ruff, Flake8, or Pylint |
| **Go** | `gofmt` / `goimports` | `golangci-lint` |
| **Java** | Spotless | Checkstyle, PMD, SpotBugs |
| **Rust** | `rustfmt` | Clippy |
| **Any** | `.editorconfig` | — (baseline for all stacks) |

For **.NET / C#** see `@skill:plain-dotnet-guardrails` — Roslyn analyzers, `.editorconfig`
severity levels, and `Directory.Build.props` are covered there in detail.

---

## What Belongs in the Repository

| File | Purpose |
|------|---------|
| `.editorconfig` | Universal baseline: indentation, line endings, charset |
| Formatter config | Stack-specific (`.prettierrc`, `pyproject.toml [tool.black]`, etc.) |
| Linter config | Stack-specific (`.eslintrc`, `pyproject.toml [tool.ruff]`, etc.) |
| Pre-commit config | `.pre-commit-config.yaml` or `package.json` hooks config |

All of the above must be committed to the repository. Local IDE settings that are not
version-controlled do not count.

---

## What Does Not Belong Here

- **Architecture rule enforcement** (dependency direction, layer isolation) → see `architecture-enforcement.md`
- **Security scanning** (dependency vulnerabilities, SAST) → see `everything-as-code.md`
- **.NET-specific Roslyn rules, editorconfig severity levels** → see `plain-dotnet-guardrails`
