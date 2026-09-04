# @plainconceptsplatform/ui-components

## 1.3.0

### Minor Changes

- `AppSidebar` now matches the Atlas shell it was modelled on: header actions beside the brand, an
  avatar element in the user card, a dropdown carrying the theme toggle and sign-out, and corrected
  collapsed-state styling.

- `AppSidebarNavItem` takes a new optional **`iconClassName`**. The icon wrapper forced
  `text-muted-foreground` when inactive and the accent colour when active, which is right for an icon
  that only identifies a destination and wrong for one whose colour carries meaning — the violet that
  marks every AI feature, for instance. Passing `iconClassName` keeps that colour in both states.
  Default behaviour is unchanged.

Two notes for anyone consuming this package, because both failed silently rather than erroring:

- The nav item prop is **`isActive`**, not `active`. With the wrong name no item is ever highlighted
  and nothing reports a problem.
- **`AppSidebarProvider` renders no element of its own**, so it accepts no `className`. Wrap it in
  your own layout element.

Also worth knowing if the components look almost-but-not-quite right in your app: Tailwind must be
told to scan this package, or any class used only inside it is never generated. The element carries
the class and nothing applies.

```css
@source "../node_modules/@plainconceptsplatform/ui-components/dist/**/*.js";
```

## 1.0.0

### Minor Changes

- 8cd0d65: Fix a hydration mismatch in `DataTable`, add the missing sidebar and chart token groups, and make "no
  shadows" true by construction.

  **ui-components**

  - `usePersistedState` no longer reads `localStorage` inside the `useState` initializer. The server had
    no storage and fell back to the default while the client's first render returned the stored value, so
    React hydrated a tree that did not match the server HTML. It now starts from the default and applies
    storage in an effect, gated so the write-back cannot overwrite the value before it is read.
  - The grouped-column drag handle is a `span` rather than a `button`. It wrapped the remove `Button`, and
    a button inside a button is invalid HTML that leaves the inner control unreachable for assistive tech.
  - Sortable headers now expose `aria-sort`. Fixed columns deliberately omit it rather than reporting
    `none`, which would advertise them as sortable.

  **ui-theme**

  - Adds the eight `--sidebar-*` tokens. The shadcn Sidebar consumes them and none existed, so the
    component rendered unstyled.
  - Adds a categorical `--chart-1` through `--chart-5` ramp. Every entry clears 3:1 against
    `--background` in both modes, and the two blue-family hues sit at opposite ends so adjacent series
    stay distinguishable.
  - Overrides the whole Tailwind shadow scale to a transparent value, so `shadow-*` classes on vendored
    shadcn components compile and paint nothing. Upstream component source can now be copied in
    unmodified. Focus rings are unaffected.
  - Honours `prefers-reduced-motion` globally in `base.css`.

  Visual change for consuming apps: shadows disappear on anything that relied on a `shadow-*` utility,
  and the sidebar picks up real surface colours. Both are the intended Platform look.

### Patch Changes

- Updated dependencies [8cd0d65]
  - @plainconceptsplatform/ui-theme@0.2.0
