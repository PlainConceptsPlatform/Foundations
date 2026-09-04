---
name: platform-onboard
description: Onboard a brownfield project onto the Plain Concepts Platform stack. Use when the user says "onboard this project", "adopt platform standards", "migrate to Platform Foundations", "align with Frontend-Foundations", or wants to add pnpm, Next.js, shadcn/ui, FSD, inversify-hooks, react-i18next, Biome, or OpenSpec to an existing project. Also use when another skill needs to reference the onboarding sequence or preflight checks.
---

# Platform Onboard

Bring a brownfield project onto the Plain Concepts Platform stack. The migration follows a fixed sequence of six domains, each with binary preflight checks. Start at the first failing check and work down.

## Scope

This checklist targets **consumer Platform applications**, not the foundation repo itself.

The Foundations repo deliberately fails some of these checks, and that is correct rather than a gap to
close: it keeps its canonical docs in `ai/` (so the docs site can sync them into a Reference section),
it publishes the theme rather than consuming it, and it has no `views/` or `entities/` because it is a
docs site and two packages, not a product app. Do not "fix" the foundation to satisfy a checklist
written for the apps that depend on it.

## The six domains

```
1. AGENTIC INFRA          Platform Harness + .opencode/ + agents + skills/
2. ARCHITECTURE DOCS      ARCHITECTURE.md + DESIGN.md + guardrails
3. OPENSPEC               openspec/ change management
4. FRONTEND STACK         pnpm -> Next -> Tailwind v4 -> shadcn -> Biome
                           -> FSD + Steiger -> inversify-hooks
                           -> react-i18next -> Platform theme
5. AGENT AUTOMATION       one work router owning every trigger, gh-aw markdown
                           workers on ubuntu-latest with engine: opencode
                           against Forge + GitHub labels
6. BACKEND GUARDRAILS     (if .NET) plain-dotnet-guardrails, arch tests
```

Domains 1 through 3 are prerequisites for 4 and 5. Domain 6 runs in parallel with 4 for .NET projects.

## Preflight

Scan all six domains before touching anything. Each check is binary: the artifact either exists or it doesn't. Record results so the user sees the full gap.

### Domain 1: Agentic infra

| Check | How to detect | Pass condition |
|---|---|---|
| Harness config | `.opencode/harness.json` exists | File present with valid JSON |
| Agent definitions | `.opencode/agents/` has at least 3 `.md` files | frontend, backend, fullstack |
| Command definitions | `.opencode/commands/` has `.md` files | At least init, plan-propose, plan-apply |
| Skill installation | `skills/` exists | Directory contains the project skills |
| Root AGENTS.md | `AGENTS.md` exists at repo root | File present, references agent files |

### Domain 2: Architecture docs

| Check | How to detect | Pass condition |
|---|---|---|
| ARCHITECTURE.md | `ARCHITECTURE.md` or `ai/ARCHITECTURE.md` exists | Not a placeholder (more than 10 lines) |
| DESIGN.md | `DESIGN.md` or `ai/DESIGN.md` exists | Not a placeholder (more than 10 lines) |
| Project guardrails | `skills/pc-guardrails-project/SKILL.md` exists | File present when project guardrails are used |

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

### Domain 5: Agent automation

The Platform default is **GitHub Agentic Workflows on `ubuntu-latest`**, with `engine: opencode`
pointed at an OpenAI-compatible gateway. This applies to public repositories too: the model comes
from the configured gateway, so nothing needs to run on a machine holding credentials.

| Check | How to detect | Pass condition |
|---|---|---|
| Work Router | `.github/workflows/` contains a conventional workflow owning the repository's triggers | One router present |
| Workers | Each `agent-*.md` declares `workflow_call` and no public trigger | Router owns every entry point |
| Caller grants | Each calling job sets `permissions: write-all` | Calls are not rejected at startup |
| Runner wiring | Each `.md` sets both `runs-on` and `runs-on-slim` | Framework jobs land on the same runner |
| Engine | Each `.md` sets `engine.id: opencode` with `OPENAI_BASE_URL` pointed at Forge | Traffic reaches the gateway |
| Compiled locks | Each `.md` has a committed `.lock.yml` | Actions runs what the source says |
| Checks | A pull-request workflow runs actionlint, shellcheck, the route matrix, and the manifest lint | The gaps the compiler cannot see are covered |
| GitHub labels | `gh label list` includes the workflow intent labels | Label set created |

A self-hosted runner is optional, and only for private or internal repositories. Never attach
one to a public repository: a pull request from a fork would execute arbitrary code on it, with
whatever credentials it holds.

For a repository that is not on GitHub at all,
[loop-task](https://github.com/PlainConceptsPlatform/loop-task) runs the same work on a
schedule from any machine.

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

Run `npx @plainconceptsplatform/agent-harness@latest` in the repository root. That installs the
Plain Concepts Platform Harness: `.opencode/` with agents and commands, the `pc-*` skills, and
`harness.json`. Then run `/repo-initialize` to generate the architecture and design documentation
for a brownfield project and activate the agent team.

On a repository that already has the harness, `npx @plainconceptsplatform/agent-harness@latest update`
pulls in the current release without prompting and preserves files anyone has edited by hand.

Keep reusable project skills in `skills/`. The agent definitions should include at minimum:
`fullstack-engineer.md`, `frontend-engineer.md`, and `backend-engineer.md`.

### Domain 2: Architecture docs

Run `/make-architecture` to generate `ARCHITECTURE.md` from the codebase and `/make-design` to
generate `DESIGN.md`. Record project-specific conventions in a project guardrail skill when one is
needed, and make it available to the agents that implement changes.

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

### Domain 5: Agent automation

The Platform default is **Agentic Workflows on `ubuntu-latest`**, public repositories
included.

1. Run `gh aw init --no-mcp --no-skill --no-agent`. The extra flags matter: the scaffolding
   they suppress is for authoring workflows with GitHub Copilot Chat, which Platform does not
   use, and it comes back every time you rerun `init` without them.
2. Copy the templates from Foundations `ai/workflows`: the router, the two workers, the shared
   components, the composite actions, and `opencode.ci.json`. The shape is **one router that
   owns every trigger and workers that have none**, so do not give a worker its own trigger.
3. Add the per-repository `FORGE_API_KEY` for the configured gateway, plus the organization
   `BOT_APP_ID` and `BOT_PRIVATE_KEY` secrets for the Platform App that lifecycle writes are
   attributed to. Configure the gateway URL in the worker environment.
4. Author or adapt workflows with the self-contained `workflow-author` and `workflow-consumer`
   skills from
   [`PlainConceptsPlatform/agentic-workflows`](https://github.com/PlainConceptsPlatform/agentic-workflows).
5. Create the GitHub labels the workflows read and write:
   `gh workflow run "Agentic Maintenance" -f operation=create_labels`.
6. Compile, lint, and then **watch one real event end to end**. `gh aw compile --strict` and
   actionlint both pass on workflows that produce zero jobs at runtime.

A self-hosted runner is supported for repositories that need one, but it is no longer the
default: the model comes from Forge either way, so the runner was only ever providing a queue
of one.

If the repository is not on GitHub,
[loop-task](https://github.com/PlainConceptsPlatform/loop-task) covers the same ground on a
schedule. When migrating a repository that still has `.loops/recipes/`, keep the recipes until
the workflows reproduce their behaviour; they are the record of what to reproduce.

### Domain 6: Backend guardrails

Only for .NET projects. Read the `plain-dotnet-guardrails` skill for what to check. The key artifacts are `Directory.Build.props`, `Directory.Packages.props`, `.editorconfig`, and an architecture test project.

## Completion criteria

The onboard is complete when every preflight check across all six domains passes. Verify by re-running the full preflight scan and confirming zero failures.

## Key rules

Each rule below comes from a real migration. Skipping one causes rework.

1. Capture characterization tests before migrating. Playwright screenshots catch regressions that manual review misses.
2. Every domain is a separate OpenSpec change. Batching domains into one change makes review impossible.
3. Platform theme packages are public npm packages. Install them with pnpm; no custom registry or
   package token is required.
4. FSD layers use canonical names: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`. Do not use underscore-prefixed names like `_app/` or `_pages/`.
5. inversify-hooks registration uses `cid` as the second argument to `addSingleton` for minification safety: `container.addSingleton<IContract>(HttpContract, cid.IContract)`.
6. react-i18next from the first day of migration. Zero magic strings. Every user-facing text element must be a translation message.
7. Biome is the sole linter. Remove ESLint config before adding Biome to avoid conflicts.
8. Next.js uses `output: "export"` for static SPA hosting served by the backend API.
9. The container is built at module-load time in a `'use client'` module, never inside `useEffect` (render runs first and `useInject` throws).
