# @plainconceptsplatform/ui-components

Shared React components for Platform frontend apps. These are **custom** foundation components
(not from shadcn) that are useful across multiple apps.

## What it contains

- `PlainLogo`: responsive brand logo that uses CSS container queries (no JavaScript) to show the
  biggest mark that fits its parent. Text follows `currentColor` (adapts to light/dark); the brand
  mark stays blue.
- `DataTable`: generic table with click-to-sort, drag-to-group, and column reorder/show-hide. It
  owns the logic and DOM structure and takes *slots* for every piece of UI that varies between apps
  (your Button, Table, icons, and translated strings), so it carries no shadcn, i18n, or icon
  dependency of its own.

## Quick start (consume in your Next.js app)

### 1. Install the package

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
| `DataTable` | `@plainconceptsplatform/ui-components/data-table` | Sortable, groupable table with column reorder/show-hide |

`DataTable` is a client component with hooks, so it is available only from its sub-path — importing
it from the package root would break Next.js server components.

## Peer dependencies

- `react` and `react-dom` (v19)
- `tailwindcss` (v4) with `@plainconceptsplatform/ui-theme` tokens loaded
- `clsx` and `tailwind-merge` (bundled as direct dependencies)

## Publishing

Published publicly to npm under the `@plainconceptsplatform` scope. No custom registry configuration
is required.
