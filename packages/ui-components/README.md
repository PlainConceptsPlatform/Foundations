# @plainconceptsplatform/ui-components

Shared React components for Platform frontend apps. These are **custom** foundation components
(not from shadcn) that are useful across multiple apps.

## What it contains

- `PlainLogo`: responsive brand logo that uses CSS container queries (no JavaScript) to show the
  biggest mark that fits its parent. Text follows `currentColor` (adapts to light/dark); the brand
  mark stays blue.

## Quick start (consume in your Next.js app)

### 1. Install the package

If you already have the `.npmrc` for `@plainconceptsplatform` (from the theme setup):

```bash
pnpm add @plainconceptsplatform/ui-components
```

### 2. Import the theme (required)

These components use Tailwind classes and semantic tokens from the theme. Make sure your app
imports the theme:

```css
@import "@plainconceptsplatform/ui-theme";
```

See [`@plainconceptsplatform/ui-theme`](../theme/README.md) for theme setup.

### 3. Use the logo

```tsx
import { PlainLogo } from "@plainconceptsplatform/ui-components";

export function Header() {
  return (
    <div className="h-12 w-48">
      <PlainLogo />
    </div>
  );
}
```

The logo fills its parent and swaps: icon under ~190px, wordmark up to ~460px, full lockup wider.
Pass `className` to constrain size.

## Available components

| Component | Import | Description |
|---|---|---|
| `PlainLogo` | `@plainconceptsplatform/ui-components` or `@plainconceptsplatform/ui-components/plain-logo` | Responsive brand logo with CSS container queries |

## Peer dependencies

- `react` and `react-dom` (v19)
- `tailwindcss` (v4) with `@plainconceptsplatform/ui-theme` tokens loaded
- `clsx` and `tailwind-merge` (bundled as direct dependencies)

## Publishing

Published to GitHub Packages under the `@plainconceptsplatform` scope, same registry as the theme
package. Both packages share the same `.npmrc` configuration.
