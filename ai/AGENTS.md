# AGENTS.md

Hub for AI coding agents working in this repo and in PlainConcepts **Platform** apps. It covers the
**frontend** stack and **backend/.NET** conventions. Keep this file short, the detail lives in the
docs and skills it points to.

## What's here

```text
ai/
├── ARCHITECTURE.md     # stack, repo layout, FSD, DI, backend architecture
├── DESIGN.md           # design tokens, visual intent, working rules
├── AGENTS.md           # this file: index/hub
└── .agents/
    ├── skills/         # 31 bundled skills (load via @skill-name, no install)
    └── agents/         # frontend-engineer, backend-engineer, docs-engineer
```

## Stack (summary)

**Next.js (App Router) + React + TypeScript (strict)**, **shadcn/ui** on **Radix** + **Tailwind v4**,
themed by **`@plainconceptsplatform/ui-theme`**, shared components from
**`@plainconceptsplatform/ui-components`** (Plain logo, ...), icons from **Lucide**. DI via
**inversify-hooks** (mandatory). Translations: **react-i18next + i18next** (mandatory, the only translation library — zero magic strings). Package manager: **pnpm**. Lint/format **Biome**; tests
**Vitest + Playwright**. Full list: [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Read these first

- Architecture & structure: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Design tokens & UI rules: [`DESIGN.md`](DESIGN.md)
- Backend (.NET): [`ARCHITECTURE.md`](ARCHITECTURE.md) (Backend architecture section)
- Theme installation in a consuming app: [`/README.md`](../README.md)

## Rules

1. **Prefer shadcn/ui and the `ARCHITECTURE.md` libraries.** Use components directly.
2. **Do not recreate existing components** or wrap third-party components without a real reason.
3. **Never hardcode design values.** Use semantic theme tokens (`bg-primary`, `text-muted-foreground`,
   `rounded-lg`), never raw hex/px.
4. **Application-specific components stay in the app** (in the slice that owns them). A component is
   shared only after the same need appears in **multiple** apps.
5. **Respect the dependency direction and slice public APIs** (see ARCHITECTURE.md).
6. **Use pnpm** for all commands.
7. **Accessibility & all states** (loading/empty/error/success) are required, see DESIGN.md.

## Theme & components setup (consuming apps)

When building a Platform app, read [`/README.md`](../README.md) for the full setup: user-level `.npmrc` +
`NPM_REGISTRY_TOKEN`, then install:

- `@plainconceptsplatform/ui-theme` for design tokens (CSS import, Outfit font, shadcn config)
- `@plainconceptsplatform/ui-components` for shared React components (Plain logo, ...)

## Bundled skills

All skills live in [`.agents/skills/`](.agents/skills/). Load them with the `skill` tool by name
(e.g. `@shadcn`, `@vitest-testing`). No installation needed.

**Workflow**
- `platform-onboard`: onboard a brownfield project onto the Platform stack (pnpm, Next.js, shadcn, FSD, inversify-hooks, react-i18next, Biome, loop-task, OpenSpec)
- `openspec-propose`: propose a change with design, specs, tasks
- `openspec-explore`: thinking partner for ideas and investigation
- `openspec-apply-change`: implement tasks from an OpenSpec change
- `openspec-archive-change`: finalize and archive a completed change
- `user-story`: user stories with Gherkin acceptance criteria

## Recommended tooling & workflow

- **pnpm** for all package/script commands.
- **Loop-engineering:** [`CKGrafico/loop-task`](https://github.com/CKGrafico/loop-task) for
  iterative task loops; [`CKGrafico/opencode-onboard`](https://github.com/CKGrafico/opencode-onboard)
  for the `make-architecture` / `make-design` onboarding skills.
- **Optimizations (recommended to enable):** RTK check, opencode-quota plugin, caveman concise
  mode, codegraph semantic index, agentmemory local memory server, humanizer skill.

## Regenerating the docs

`ARCHITECTURE.md` and `DESIGN.md` follow the `opencode-onboard` skills (`ob-make-architecture`,
`ob-make-design`). Regenerate them from the codebase rather than hand-editing large sections;
`src/theme.css` remains the source of truth for design tokens.
