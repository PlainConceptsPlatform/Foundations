# Platform-Foundations

**Platform Foundations** is the shared foundation for PlainConcepts **Platform** apps. It keeps many
independent apps consistent and easy for developers *and* AI agents to work in, without becoming a
heavy in-house framework.

It covers the **frontend** (a shared theme, conventions, docs, and a themed showcase) and
**backend/.NET** conventions (recommended skills and a reference architecture in
[`ai/ARCHITECTURE.md`](ai/ARCHITECTURE.md)).

It is **not** a component library, an app framework, or a design system to be maintained by hand.

## What's here

```text
ai/               ARCHITECTURE (incl. Stack) + DESIGN + AGENTS + .agents/ (skills, agents)
apps/docs         Fumadocs (Next.js), docs + live themed component previews
packages/theme    @plainconceptsplatform/ui-theme, design tokens (CSS only)
packages/ui-components  @plainconceptsplatform/ui-components, shared React components (Plain logo, ...)
```

## Core principles

1. Prefer established open-source libraries over custom code.
2. Use **shadcn/ui** components directly; don't wrap them or build a proprietary library.
3. App-specific components live in the app. Share a component only after the same need appears in
   **multiple** apps.
4. The foundation owns the **theme, conventions, docs, and showcase**, nothing more.
5. Keep the scope small. Add a directory/package only when it has a clear job today.

## Stack

Next.js (App Router) + React + TypeScript, shadcn/ui on Radix + Tailwind v4, themed by
`@plainconceptsplatform/ui-theme`, icons from Lucide. DI via inversify-hooks (mandatory).
Biome, Vitest + Playwright, pnpm. See [`ai/ARCHITECTURE.md`](ai/ARCHITECTURE.md).

## Getting started (this repo)

```bash
pnpm install
pnpm dev          # run the docs/showcase site (Fumadocs)
pnpm lint         # Biome
pnpm test         # Vitest
```

## Using Platform packages in your app

The Platform theme and shared components are private packages on GitHub Packages.

### 1. Configure registry access

Add an `.npmrc` to your app root:

```text
@plainconceptsplatform:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_your_token
```

Create a GitHub **classic personal access token** at [Settings > Developer settings > Personal access
tokens](https://github.com/settings/tokens) with the `read:packages` permission. If your organization
uses SAML SSO, authorize the token for the organization. Replace `ghp_your_token` in `.npmrc` with the
token value before installing. Keep `.npmrc` private and never commit the token.

### 2. Install everything

```bash
pnpm add @plainconceptsplatform/ui-theme @plainconceptsplatform/ui-components tailwindcss
```

### 3. Initialize

```bash
npx @plainconceptsplatform/ui-theme@latest init
```

This copies `components.json`, adds the theme import to your global stylesheet, and shows you how
to wire the Outfit font in your root layout.

### 4. Add shadcn components

```bash
npx shadcn@latest add button card dialog ...
```

Full details in [`packages/theme/README.md`](packages/theme/README.md).

## For AI agents

Start with [`AGENTS.md`](AGENTS.md). It points to the [`ai/`](ai/) folder, which has conventions,
architecture, design rules, bundled skills, and agent definitions.

## Documentation

- [`ai/ARCHITECTURE.md`](ai/ARCHITECTURE.md): reference architecture + stack (frontend and backend/.NET)
- [`ai/DESIGN.md`](ai/DESIGN.md): design tokens & UI rules
- [`packages/theme/README.md`](packages/theme/README.md): theme package setup and conventions
- [`packages/ui-components/README.md`](packages/ui-components/README.md): shared components (Plain logo)
- [`apps/docs/README.md`](apps/docs/README.md): docs/showcase site structure
