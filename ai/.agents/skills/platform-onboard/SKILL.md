---
name: platform-onboard
description: Onboard a brownfield project onto the Plain Concepts Platform stack. Use when the user says "onboard this project", "adopt platform standards", "migrate to Platform Foundations", "align with Frontend-Foundations", or wants to add pnpm, Next.js, shadcn/ui, FSD, inversify-hooks, react-i18next, Biome, loop-task automation, or OpenSpec to an existing project. Also use when another skill needs to reference the onboarding sequence or preflight checks.
---

# Platform Onboard

Bring a brownfield project onto the Plain Concepts Platform stack. The migration follows a fixed sequence of six domains, each with binary preflight checks. Start at the first failing check and work down.

## The six domains

```
1. AGENTIC INFRA          opencode-onboard + .opencode/ + agents + skills
2. ARCHITECTURE DOCS      ARCHITECTURE.md + DESIGN.md + guardrails
3. OPENSPEC               openspec/ change management
4. FRONTEND STACK         pnpm -> Next -> Tailwind v4 -> shadcn -> Biome
                           -> FSD + Steiger -> inversify-hooks
                           -> react-i18next -> Platform theme
5. LOOP AUTOMATION        .loops/recipes/ + GitHub labels
6. BACKEND GUARDRAILS     (if .NET) plain-dotnet-guardrails, arch tests
```

Domains 1 through 3 are prerequisites for 4 and 5. Domain 6 runs in parallel with 4 for .NET projects.

## Preflight

Scan all six domains before touching anything. Each check is binary: the artifact either exists or it doesn't. Record results so the user sees the full gap.

### Domain 1: Agentic infra

| Check | How to detect | Pass condition |
|---|---|---|
| opencode-onboard config | `.opencode/opencode-onboard.json` exists | File present with valid JSON |
| Agent definitions | `.opencode/agents/` has at least 3 `.md` files | frontend, backend, fullstack |
| Command definitions | `.opencode/commands/` has `.md` files | At least init, plan-propose, plan-apply |
| Skill installation | `.agents/skills/` or `.opencode/skills/` exists | Directory with skills |
| Root AGENTS.md | `AGENTS.md` exists at repo root | File present, references agent files |

### Domain 2: Architecture docs

| Check | How to detect | Pass condition |
|---|---|---|
| ARCHITECTURE.md | `ARCHITECTURE.md` exists at root | Not a placeholder (more than 10 lines) |
| DESIGN.md | `DESIGN.md` exists at root | Not a placeholder (more than 10 lines) |
| Project guardrails | `.agents/skills/ob-guardrails-project/SKILL.md` exists | File present |

### Domain 3: OpenSpec

| Check | How to detect | Pass condition |
|---|---|---|
| OpenSpec config | `openspec/config.yaml` exists | File present |
| Archive directory | `openspec/changes/archive/` exists | Directory present |

### Domain 4: Frontend stack

| Check | How to detect | Pass condition |
|---|---|---|
| pnpm | `pnpm-lock.yaml` exists, no `package-lock.json` or `yarn.lock` | Single lockfile, pnpm |
| Next.js | `next.config.*` exists with `output: "export"` or App Router | Config present |
| Tailwind v4 | CSS file contains `@import "tailwindcss"` | v4 syntax, not v3 `@tailwind` directives |
| shadcn/ui | `components.json` exists | Config present with style + aliases |
| Biome | `biome.json` exists, no `eslint.config.*` | Biome is sole linter |
| FSD structure | `src/app/`, `src/pages/` or `src/shared/` exist | Canonical layer dirs present |
| Steiger | `steiger.config.*` exists | FSD linter configured |
| inversify-hooks | `inversify-hooks` in `package.json` deps + composition root file exists | DI container registered |
| react-i18next | `react-i18next` + `i18next` in deps + message files exist | i18n infrastructure in place |
| Platform theme | `@plainconceptsplatform/ui-theme` in `package.json` deps | Tokens package installed |
| Platform components | `@plainconceptsplatform/ui-components` in `package.json` deps (optional) | Shared components installed |

### Domain 5: Loop automation

| Check | How to detect | Pass condition |
|---|---|---|
| Loop recipes | `.loops/recipes/` exists with at least `dev-loop.json` | Dev loop recipe present |
| GitHub labels | `gh label list` includes `code:pick` | Label set created |

### Domain 6: Backend guardrails (.NET only)

Skip if no `.csproj` or `.slnx` files. Otherwise:

| Check | How to detect | Pass condition |
|---|---|---|
| Directory.Build.props | `Directory.Build.props` exists at solution root | Build defaults configured |
| Central Package Management | `Directory.Packages.props` exists | CPM enabled |
| .editorconfig | `.editorconfig` exists at root | Code style rules present |
| Architecture tests | Test project with arch test references | Arch test project exists |

## Execution

Process domains in order. For each domain:

1. If all checks pass, skip.
2. If any check fails, create an OpenSpec change for that domain.
3. Run the change through `propose -> apply -> evidence -> archive`.
4. After archive, re-run the preflight for that domain to confirm.

### Domain 1: Agentic infra

Run `opencode-onboard init` in the repository root. This generates `.opencode/` with agents, commands, and `opencode-onboard.json`. Then run `/init` (the opencode command) to install skills into `.agents/skills/`.

The agent definitions should include at minimum: `fullstack-engineer.md`, `frontend-engineer.md`, `backend-engineer.md`. Each agent file must list `@ob-guardrails-generic` and `@ob-guardrails-project` as the first abilities.

### Domain 2: Architecture docs

Run `/make-architecture` to generate `ARCHITECTURE.md` from the codebase. Run `/make-design` to generate `DESIGN.md`. Then run `/make-guardrails` to extract project guardrails from the architecture into the `ob-guardrails-project` skill and wire it into every agent.

These commands are idempotent. Re-run them after any significant codebase change.

### Domain 3: OpenSpec

Run `openspec init` to create `openspec/config.yaml` and the archive directory. If the project already has an `openspec/` directory, verify `config.yaml` is valid.

Each domain below generates its own OpenSpec change. Do not batch domains into one change.

### Domain 4: Frontend stack

This is the largest domain. Read `references/frontend-migration.md` before starting. The migration has a strict dependency order:

```
pnpm -> Next.js -> Tailwind v4 -> shadcn/ui -> Biome -> FSD + Steiger -> inversify-hooks -> react-i18next -> Platform theme
```

Each step is an OpenSpec change. Capture Playwright characterization tests before the first migration step to preserve visual and behavioral parity. Run these tests after every step.

### Domain 5: Loop automation

Read `references/loop-recipes.md` before starting. The setup has two parts:

1. Create GitHub labels (use the setup script from the reference).
2. Copy loop recipe JSON files into `.loops/recipes/`.

### Domain 6: Backend guardrails

Only for .NET projects. Read the `plain-dotnet-guardrails` skill for what to check. The key artifacts are `Directory.Build.props`, `Directory.Packages.props`, `.editorconfig`, and an architecture test project.

## Completion criteria

The onboard is complete when every preflight check across all six domains passes. Verify by re-running the full preflight scan and confirming zero failures.

## Key rules

Each rule below comes from a real migration. Skipping one causes rework.

1. Capture characterization tests before migrating. Playwright screenshots catch regressions that manual review misses.
2. Every domain is a separate OpenSpec change. Batching domains into one change makes review impossible.
3. Platform theme packages come from GitHub Packages. Configure the registry in the user's `.npmrc` and provide `NPM_REGISTRY_TOKEN` through a user environment variable. Never commit the token.
4. FSD layers use canonical names: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`. Do not use underscore-prefixed names like `_app/` or `_pages/`.
5. inversify-hooks registration uses `cid` as the second argument to `addSingleton` for minification safety: `container.addSingleton<IContract>(HttpContract, cid.IContract)`.
6. react-i18next from the first day of migration. Zero magic strings. Every user-facing text element must be a translation message.
7. Loop recipes use the `code:pick` / `code:doing` / `code:done` / `code:review` label set. The dev-loop auto-merges with `--admin`; review-label issues stay open for human review.
8. Biome is the sole linter. Remove ESLint config before adding Biome to avoid conflicts.
9. Next.js uses `output: "export"` for static SPA hosting served by the backend API.
10. The container is built at module-load time in a `'use client'` module, never inside `useEffect` (render runs first and `useInject` throws).
