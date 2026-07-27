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

Create a user-level `.npmrc` that maps the scope to GitHub Packages. Do not add credentials to an app repository:

```text
# Windows: %USERPROFILE%\.npmrc
# macOS/Linux: ~/.npmrc
@plainconceptsplatform:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_REGISTRY_TOKEN}
```

Create and authorize a personal access token as follows:

1. Open [GitHub token settings](https://github.com/settings/tokens) and select **Generate new token
   (classic)**.
2. Give the token the `read:packages` permission and generate it.
3. On the token list, select **Configure SSO** next to the new token and authorize
   **PlainConceptsPlatform**. This step is required by the organization’s SAML SSO policy.
4. Store the token in the `NPM_REGISTRY_TOKEN` user environment variable. For PowerShell on Windows:

```powershell
[Environment]::SetEnvironmentVariable('NPM_REGISTRY_TOKEN', 'YOUR_TOKEN', 'User')
```

Open a new terminal, then:

```bash
pnpm add @plainconceptsplatform/ui-theme tailwindcss
```

CI must inject `NPM_REGISTRY_TOKEN` from its secret store. Never commit a token in `.npmrc` or any other file.

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
