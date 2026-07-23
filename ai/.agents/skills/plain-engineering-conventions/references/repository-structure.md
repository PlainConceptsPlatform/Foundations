# Repository Structure

Standard folder layout, mandatory documentation files, and root configuration conventions for
Plain Concepts projects — language and framework agnostic.

## Principle

**A repository must be self-explanatory from the root.** A developer who has never seen the project
should be able to understand what it is, how to run it, and how to contribute without asking anyone.

---

## Standard Folder Layout

Every repository should follow this top-level structure. Not all folders are required for every
project — apply what is relevant.

```
repo-root/
├── src/              # All production source code
├── tests/            # All tests (unit, integration, e2e)
├── docs/             # Project documentation
│   └── adr/          # Architecture Decision Records
├── infra/            # Infrastructure as Code (Terraform, Bicep, Pulumi…)
├── scripts/          # Automation scripts (build helpers, seed data, migrations…)
├── .github/          # CI/CD pipelines, PR templates, issue templates, agent definitions (GitHub; use .gitlab/ or equivalent for other platforms)
├── README.md         # Project entry point — mandatory
├── CONTRIBUTING.md   # Development workflow — mandatory
├── .editorconfig     # Editor formatting rules — mandatory
└── .gitignore        # Stack-appropriate ignore rules — mandatory
```

### Rules

| Rule | Rationale |
|------|-----------|
| Production code lives under `src/` | Separates deliverable code from tooling and tests |
| Tests live under `tests/` (not inside `src/`) | Makes it trivial to exclude tests from builds and deployments |
| Infrastructure code lives under `infra/` | Enforces IaC discipline and keeps cloud config reviewable |
| Scripts are isolated under `scripts/` | Prevents ad-hoc scripts from polluting source directories |
| CI/CD config lives under `.github/` (or platform equivalent) | Standard location for GitHub Actions, GitLab CI, Azure Pipelines; keeps automation discoverable |

---

## Mandatory Root Files

### README.md

Every repository **must** have a `README.md` at the root. It is the contract between the project
and every developer who will ever work on it.

**Required sections:**

| Section | Content |
|---------|---------|
| **Project name + description** | One sentence: what this is and what problem it solves |
| **Prerequisites** | Runtime versions, required tools, environment variables |
| **Getting started** | Step-by-step: clone → install → build → run |
| **Running tests** | How to run unit tests, integration tests, and any test suites |
| **Project structure** | Brief map of the folder layout and what lives where |
| **Contributing** | Link to `CONTRIBUTING.md` |

A README that only says "this is project X" is not acceptable.

### CONTRIBUTING.md

Documents the development workflow so contributors can work consistently without tribal knowledge.

**Required sections:**

| Section | Content |
|---------|---------|
| **Development setup** | Full local environment setup from scratch |
| **Branch naming** | Convention: `feat/`, `fix/`, `chore/`, `docs/` prefixes |
| **Commit messages** | Convention (Conventional Commits recommended): `type(scope): description` |
| **PR process** | How to open a PR, what reviewers expect, definition of "ready to merge" |
| **Code review expectations** | What reviewers look for; turnaround SLA if applicable |

### .editorconfig

Enforces consistent formatting (indentation, line endings, charset) across all editors and IDEs
without requiring IDE-specific config files to be committed.

Minimum recommended settings:

```ini
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{yml,yaml,json}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

### .gitignore

Must be tailored to the project stack. Do not commit build artifacts, local secrets, IDE files,
or OS-generated files.

Rules:
- Use [gitignore.io](https://www.toptal.com/developers/gitignore) as a starting point
- Add stack-specific entries (e.g. `bin/`, `obj/` for .NET; `node_modules/` for Node)
- Never commit `.env` files with real values — commit `.env.example` instead

---

## Documentation as Code

### Architecture Decision Records (ADRs)

ADRs capture the *why* behind significant technical decisions. They prevent revisiting the same
discussions and help new team members understand context.

**Location:** `docs/adr/`

**Naming convention:** `NNNN-short-title.md` — e.g. `0001-use-postgresql.md`

**Lightweight template:**

```markdown
# NNNN — Decision title

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by [NNNN]

## Context

What situation or problem prompted this decision?

## Decision

What was decided?

## Consequences

What becomes easier? What becomes harder? What are the trade-offs?
```

**When to write an ADR:**

- Choosing a technology, framework, or library with significant impact
- Establishing an architectural pattern for the project
- Deciding to deviate from a company-wide convention (requires justification)
- Any decision that would otherwise be questioned in future code reviews

### docs/ Structure

```
docs/
├── adr/              # Architecture Decision Records (numbered, immutable)
├── runbooks/         # Operational procedures (deploy, rollback, incident response)
└── *.md              # Any other project documentation (pilot plans, onboarding guides…)
```

ADRs are **immutable once accepted** — never edit an accepted ADR. If the decision changes,
write a new ADR that supersedes the old one.

---

## AI Tooling Files

Projects that use AI-assisted development should also include:

| File | Location | Purpose |
|------|----------|---------|
| `copilot-instructions.md` | `.github/` | Project-scoped AI constraints and coding standards |
| `*.agent.md` | `.github/agents/` or `agents/` | Reusable AI workflow definitions |

See the AI Constitution convention for details.
