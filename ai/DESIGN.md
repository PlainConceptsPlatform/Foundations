---
name: Platform Foundations Design System
description: Design tokens and intent for PlainConcepts Platform apps (Platform styleguide).
source: "@plainconceptsplatform/ui-theme (src/theme.css is the source of truth)"
typography:
  family: Outfit
  scale:
    h1: { weight: 700, size: 20px, lineHeight: 25px }
    paragraph-l: { weight: 400, size: 16px, lineHeight: 24px }
    paragraph-m: { weight: 400, size: 14px, lineHeight: 24px }
    paragraph-s: { weight: 400, size: 12px, lineHeight: 15px }
color:
  primitives:
    blue: ["#f5f8ff", "#ebf0ff", "#dce6ff", "#5282ff", "#2f69ff", "#0043f0", "#0032b2"]
    neutral: ["#ffffff", "#fafafc", "#f2f3f7", "#e9eaf2", "#dfe1ec", "#8e8f95", "#6a6f74", "#4a4a4a", "#383838", "#0d0e0f"]
    error: { 100: "#fde1e6", 300: "#f99bac", 500: "#f33859", 700: "#c72e49" }
    warning: { 100: "#feeec6", 300: "#fddd8c", 500: "#fbc740", 700: "#a6842a" }
    success: { 100: "#d8f1ef", 300: "#9cdcd7", 500: "#3abaaf", 700: "#257770" }
    info: { 100: "#e3f8ff", 300: "#99e1f9", 500: "#00b5f1", 700: "#008ebd" }
  semantic-light:
    background: "#ffffff"
    foreground: "#0d0e0f"
    primary: "#2f69ff"
    primary-foreground: "#ffffff"
    secondary: "#f2f3f7"
    muted: "#f2f3f7"
    muted-foreground: "#6a6f74"
    accent: "#ebf0ff"
    accent-foreground: "#0032b2"
    destructive: "#f33859"
    border: "#e9eaf2"
    input: "#dfe1ec"
    ring: "#2f69ff"
    success: "#3abaaf"
    warning: "#fbc740"
    info: "#00b5f1"
  semantic-dark:
    background: "#0d0e0f"
    foreground: "#fafafc"
    card: "#17181b"
    primary: "#2f69ff"
    secondary: "#22242a"
    muted: "#22242a"
    muted-foreground: "#8e8f95"
    accent: "#17244a"
    accent-foreground: "#dce6ff"
    border: "#2a2c33"
    input: "#2a2c33"
    ring: "#5282ff"
spacing:
  system: "Tailwind default 4px scale (0.25rem step)"
radii:
  base: 0.375rem
  scale: { sm: "calc(base - 4px)", md: "calc(base - 2px)", lg: base, xl: "calc(base + 4px)" }
  note: foundation-chosen; verify against Figma
breakpoints:
  system: "Tailwind defaults (sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536)"
modes: [light, dark]
domain-palettes:
  note: "Special Days, Unit, Area, Teams palettes are app-specific data-viz sets. They live in the app, NOT in the shared theme."
---

# Design

The Platform styleguide, and the design intent behind it. This document is generated/updated
from `@plainconceptsplatform/ui-theme`, `src/theme.css` is the source of truth; the tokens above
mirror it for reference and tooling.

## Visual intent

A calm, information-dense, professional look for internal line-of-business tools. **Outfit** is the
single typeface, geometric, friendly, highly legible at small sizes, which suits data-heavy
screens. A confident **royal blue (`#2f69ff`)** carries brand and primary actions; everything else
is a restrained cool-neutral ramp so data and status colors stand out rather than the chrome.

Status is communicated through the **functional palette**, red for destructive/error, amber for
warning, teal for success, cyan for info, each with a light background tint, a solid base, and a
dark variant for text-on-tint.

## Working rules

- **Check the library first.** Before building a component, look for it in shadcn/ui and the
  companion libraries in `ARCHITECTURE.md`. Do not recreate what exists.
- **Use semantic tokens, never hardcoded values.** `bg-primary`, `text-muted-foreground`,
  `border`, `rounded-lg`, not raw hex or pixel values.
- **Accessibility is a baseline, not a feature.** Meet WCAG 2.2 AA contrast; every interactive
  element is keyboard reachable with a visible focus ring (`ring`); label all inputs; respect
  `prefers-reduced-motion`.
- **Design every state.** Loading (skeletons), empty, success, and error states are required, not
  optional. Validate forms inline with clear messages.
- **Responsive by default.** Mobile-first; use the Tailwind breakpoints; verify at sm/md/lg.
- **Consistency over cleverness.** Prefer the theme's tokens and shadcn patterns to bespoke styling.

## Motion and elevation

A single contract, so nothing needs a bespoke hover and the whole surface feels
deliberate rather than assembled.

- **Transition `color`, `background-color`, `border-color`, `opacity` and `transform` only.** Never
  `width`, `height`, `top`/`left`, or `box-shadow`; they force layout or paint work on every frame.
- **150ms, ease-out**, for anything triggered by hover, focus or a state change. Radix overlays keep
  their own enter/exit animations (`tw-animate-css`); do not add a second transition on top.
- **Motion follows a state change.** If nothing changed, nothing moves: no scroll-triggered reveals,
  parallax, auto-rotating carousels, count-up numbers, or typewriter text.
- **Always honour `prefers-reduced-motion: reduce`** by dropping to no transition.
- **Elevation is a border plus a surface**, `border-border` with `bg-card`, not a shadow. This is
  enforced by the theme, not by discipline: Tailwind's shadow scale is overridden to a transparent
  value, so `shadow-*` classes on vendored shadcn components compile but paint nothing, and upstream
  component source can be copied in unmodified. Focus rings are unaffected.

## Data visualization

Use the shared categorical ramp `--chart-1` through `--chart-5` for series colour. Every entry clears
3:1 against `--background` in both modes, so thin lines and small legend swatches stay visible, and
the two blue-family hues sit at opposite ends so adjacent series never collide. Do not use `--accent`
or other tint tokens as a series colour; they are hover surfaces and disappear against a card.
Domain-specific palettes (Special Days, Unit, Area, Teams) stay in the app that owns them.

## Application-specific vs shared

App-specific components stay in the app (in the slice that owns them). A component becomes a
candidate for sharing **only** after the same real requirement appears in **multiple** apps, and
even then it's reviewed before promotion. The shared layer owns tokens and conventions, not a
component catalog.

<!-- Last updated: 2026-07-23 -->
