# @plainconceptsplatform/ui-theme

The shared theme for Platform frontend apps, the **Platform styleguide** expressed as
design tokens for **shadcn/ui + Tailwind v4**. This package is the *only* shared code in the
foundation: it ships **tokens, not components**.

## What it contains

- `src/theme.css`, the single source of truth: primitive palettes, semantic tokens
  (light + dark), radius and elevation, plus the Tailwind `@theme` mapping.
- `src/base.css`, element defaults (body colors, `Outfit` type scale).
- `src/index.css`, one entry point (`tailwindcss` + theme + base + dark variant).
- `components.json`, a **base shadcn config to copy into each app** (aliases match the FSD
  layout: `shared/ui`, `shared/lib`, ...).

## Quick start (consume the theme in your Next.js app)

### 1. Install the package

```bash
pnpm add @plainconceptsplatform/ui-theme tailwindcss
```

### 2. Import the theme

In your global stylesheet:

```css
@import "@plainconceptsplatform/ui-theme";
```

### 3. Load the Outfit font

Load **Outfit** with `next/font/google` and expose it as `--font-sans` in your root layout:

```tsx
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={outfit.variable}>{children}</html>;
}
```

### 4. Copy the shadcn config

Copy this package's `components.json` into your app root, then add components:

```bash
npx shadcn@latest add button
```

This scaffolds components into `src/shared/ui/` (matching the FSD aliases in `components.json`).

## Adding the Plain logo to your app

The `PlainLogo` is shipped from the `@plainconceptsplatform/ui-components` package (the theme
package is CSS-only):

```bash
pnpm add @plainconceptsplatform/ui-components
```

```tsx
import { PlainLogo } from "@plainconceptsplatform/ui-components";
<PlainLogo />
```

The logo uses CSS container queries (no JavaScript) to swap between icon, wordmark, and full lockup
based on the parent's width. Text follows `currentColor` (works in light/dark); the brand mark
stays blue. See [`packages/ui-components/README.md`](../ui-components/README.md) for full details.

## Conventions

- **Never hardcode colors/spacing**, use the semantic tokens (`bg-primary`,
  `text-muted-foreground`, ...).
- **Icons: Lucide** (`lucide-react`), the shadcn default.
- Dark mode: toggle `class="dark"` on `<html>`.

## Consistency model

Components are copied per app (shadcn model). This package keeps every app visually consistent
because they all import the **same versioned tokens**. Bump the version to roll out theme changes.

> `--radius` is a foundation-chosen default marked `TODO verify` against Figma. The design uses
> no shadow tokens.
