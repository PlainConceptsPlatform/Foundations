# @plainconceptsplatform/docs

The docs and themed showcase for Platform Foundations, built with **Fumadocs** (Next.js). It renders
the repo docs and shows the shared theme on real components and screens, including the Plain logo
and the full component catalog.

## Run it

```bash
pnpm install          # from the repo root
pnpm --filter @plainconceptsplatform/docs dev
```

## Build (static output)

```bash
pnpm --filter @plainconceptsplatform/docs build   # outputs apps/docs/out
```

The CI workflow deploys to Azure App Service. For local dev, the default config works without
environment overrides.

## Structure

```text
apps/docs/
├── content/docs/
│   ├── index.mdx              # Overview
│   ├── tokens.mdx             # Color, typography, radius
│   ├── components/            # shadcn/ui + custom component pages
│   │   ├── index.mdx
│   │   ├── button.mdx
│   │   ├── plain-logo.mdx     # Custom: responsive Plain logo
│   │   └── ...                # 30+ shadcn component pages
│   ├── examples.mdx           # Realistic screen examples
│   └── reference/             # Synced from ai/ (ARCHITECTURE, DESIGN, AGENTS)
├── components/
│   ├── plain-logo.tsx         # PlainLogo component source
│   ├── logo-svgs.ts           # Generated SVG strings for the logo
│   ├── showcase.tsx           # Token showcase widgets (palette, type scale)
│   └── previews/              # Component preview widgets
├── scripts/
│   └── sync-docs.mjs          # Syncs ai/*.md into content/docs/reference/
└── app/                       # Next.js App Router, layouts, global.css
```

## Content model

- **Live component pages** (`content/docs/components/*.mdx`): each shows the component themed with
  our tokens, the usage code, and a link to [ui.shadcn.com](https://ui.shadcn.com) for the full API.
  Do not re-document shadcn APIs here.
- **Reference docs** (`content/docs/reference/`): generated from `ai/ARCHITECTURE.md`,
  `ai/DESIGN.md`, and `ai/AGENTS.md` by `scripts/sync-docs.mjs` (runs on predev/prebuild). These
  are generated copies, gitignored. The source of truth is the `ai/` folder.
- **Tokens page** (`content/docs/tokens.mdx`): shows colors, typography, and radius from the live
  theme.
- **Examples page** (`content/docs/examples.mdx`): realistic screens showing the tokens working
  together.

## Notes

- This app targets **Fumadocs v15 / Next 15 / Tailwind v4 / React 19**.
- `postinstall` runs `fumadocs-mdx` to generate the `.source` types.
- The `PlainLogo` component (`components/plain-logo.tsx`) is a reference component. Other repos
  copy it into their own `shared/ui` folder. See the
  [Plain logo docs page](/docs/components/plain-logo) for instructions.
- Keep this a demonstration of the theme. Do not re-document shadcn component APIs; link to
  [ui.shadcn.com](https://ui.shadcn.com) instead.
