// Per-component data for scripts/gen-component-pages.mjs.
//
// `whenToUse` and `platformNotes` are the only hand-written prose in the catalog and
// exist to say what is true for Platform apps specifically. Deliberately NOT a
// restatement of the shadcn API: every page links out to ui.shadcn.com for that.
//
// `source` controls the Install and Full API blocks:
//   omitted    a shadcn registry item, installed with `shadcn add <slug>`
//   "package"  ships from @plainconceptsplatform/ui-components
//   "recipe"   assembled from other registry items; there is no `add <slug>`
//   "none"     not an installable component (a docs concept)

export const COMPONENTS = {
  accordion: {
    title: "Accordion",
    description:
      "A vertically stacked set of interactive headings that each reveal a section of content.",
    demo: "AccordionDemo",
    whenToUse:
      "Use an accordion to collapse a long screen into labelled sections a user opens one at a time: FAQ blocks, grouped settings, the steps of a long form. When there is only one region to show or hide, `Collapsible` is the smaller tool; when the sections are peers a user switches between rather than reads through, use `Tabs`.",
    platformNotes:
      "The only tokens in play are `border` on each item and `ring` on the trigger's focus outline, so an accordion sits straight on the page surface with no `bg-card` and nothing to lift it (the theme compiles `shadow-*` to a transparent value in any case). The open and close height animation comes from the `animate-accordion-down` / `animate-accordion-up` keyframes in `tw-animate-css`, imported once in `app/global.css`, and `base.css` already flattens it to 1ms under `prefers-reduced-motion`, so do not layer a transition of your own on top. Trigger labels and panel copy are user-facing text, which means react-i18next keys and no literals in JSX. The component lives in `shared/ui`; the list of sections and the content inside them belongs to the slice that owns the data.",
  },
  alert: {
    title: "Alert",
    description: "Displays a callout for user attention.",
    demo: "AlertDemo",
    whenToUse:
      "Alert is the persistent inline message about the state of a screen or form: a validation summary, a degraded integration, a warning the user should keep seeing. Use `toast` when the message is transient and `AlertDialog` when the user must respond before continuing.",
    platformNotes:
      'Only two variants ship, `default` and `destructive`, and both sit on `bg-card`, so an Alert is a bordered card rather than a tinted banner. The theme also exposes `--success`, `--warning` and `--info` beyond base shadcn, but no Alert variant consumes them: apply those tokens yourself if you need a success or info callout. `role="alert"` is always set, so an Alert present on first render is announced by screen readers; keep that for real state changes and prefer plain text for static guidance. This is the mandatory error state for a failed fetch or mutation, sitting alongside `Skeleton` for loading and `Empty` for no data, and its title and description are react-i18next messages.',
  },
  "alert-dialog": {
    title: "Alert Dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
    demo: "AlertDialogDemo",
    whenToUse:
      "Reach for AlertDialog when the user must confirm something consequential before anything happens: deleting a record, discarding unsaved work, running a job that cannot be undone. For ordinary editing use `Dialog`, and report the outcome afterwards with a toast rather than a second AlertDialog.",
    platformNotes:
      'The Platform copy diverges from upstream in a way worth knowing: `AlertDialogAction` and `AlertDialogCancel` render through the `Button` component, so they accept `variant` and `size` directly (`variant="destructive"` on the action for a delete, which pulls `--destructive`), and there is an extra `AlertDialogMedia` slot plus `size="sm"` on the content. Nothing dismisses it by outside click and there is no close icon, which is the point, so the two button labels carry the whole decision: make them specific verbs, and make them i18next messages, not `t("ok")`. Enter and exit come from tw-animate-css and the theme\'s base layer already collapses them under `prefers-reduced-motion: reduce`, so do not layer a transition on top.',
  },
  "aspect-ratio": {
    title: "Aspect Ratio",
    description: "Displays content within a desired ratio.",
    demo: "AspectRatioDemo",
    whenToUse:
      "Hold a fixed ratio box with `AspectRatio` when the media's intrinsic size is outside your control: a screenshot, a video embed, a map, a chart slot in a grid. If the ratio is static, Tailwind's `aspect-video` or `aspect-square` on a plain `div` does the same with less machinery. For the pending state, put a `Skeleton` inside the ratio box, not in place of it.",
    platformNotes:
      "It contributes no colour of its own, so the surface, the radius and the clipping are yours: `bg-muted`, `rounded-md` (from `--radius`) and `overflow-hidden`, as the demo does. Its value in a Platform app is layout stability: reserving the box means a late-arriving image or embed does not shove the rows around it, which matters most in dashboard card grids. Keep the ratio in the component that owns the layout rather than threading it as a prop through several slices, and any `img` inside still needs `alt` text from an i18next message when the image conveys meaning.",
  },
  attachment: {
    title: "Attachment",
    description: "A file attachment component with upload states and media preview.",
    demo: "AttachmentDemo",
    block: true,
    whenToUse:
      'Use `Attachment` to render a file that already exists in the flow: uploads queued in a chat composer, evidence on a record, an export an agent produced. The affordance for choosing a file is a labelled `Input type="file"` inside a `Field`, and a row that is not a file is an `Item`.',
    platformNotes:
      '`state` (`idle`, `uploading`, `processing`, `error`, `done`) is where the mandatory states live for this component, so wire all of them instead of swapping in a `Skeleton`: `error` recolours border and text through `--destructive`, and an empty attachment list still needs its own `Empty` block. The card is already border plus `bg-card`, which is the entire elevation story. `AttachmentTitle` reaches for a `shimmer` utility the Platform theme does not define, so it paints nothing; keep progress as text in `AttachmentDescription` (the demo\'s "Uploading 64%"), which is also what a screen reader announces, and build that string with i18next interpolation. One layout trap: `AttachmentTrigger` is an absolutely positioned overlay at `inset-0 z-10`, so any button has to sit inside `AttachmentActions` (`z-20`) or it stops being clickable.',
  },
  avatar: {
    title: "Avatar",
    description: "An image element with a fallback for representing the user.",
    demo: "AvatarDemo",
    whenToUse:
      'Avatar carries a person or tenant identity next to a name: table rows, comment headers, the account menu. When several people share one row, use `AvatarGroup` with `AvatarGroupCount` for the overflow. For a non-person entity such as an app, a document or an integration, an `Item` with `ItemMedia variant="icon"` communicates better than a circle of initials.',
    platformNotes:
      'The fallback (`bg-muted` with `text-muted-foreground`) is what most Platform screens actually render, because photo URLs from the identity provider often come back empty: always compute initials so the circle is never blank. `AvatarImage` needs a real `alt`, and when the name is printed right beside the avatar the image is decorative, so `alt=""` stops a screen reader announcing the name twice. Initials come from data and are not translated, but everything around them ("Assigned to", the account menu entries) is an i18next message. `AvatarBadge` and the group offsets ring with `ring-background`, so an avatar placed on a tinted surface shows a ring in the page background colour rather than the surface colour: put it on `bg-card` or override the ring.',
  },
  badge: {
    title: "Badge",
    description: "Displays a badge or a component that looks like a badge.",
    demo: "BadgeDemo",
    whenToUse:
      "Badges label the state or category of a record inline: status in a table cell, a count beside a tab, a role next to a name. If it is clickable it is an action, so use a `Button` (or a link via `asChild`) instead. For something the user has to read and acknowledge, use `Alert`.",
    platformNotes:
      "The variants map onto `--primary`, `--secondary`, `--destructive` and `--border`, and there is deliberately no success, warning or info variant, so those tints come from the functional tokens applied by class. Badge renders a `<span>` with no accessible role, which means the state has to be legible from its text (`Active`, not a bare coloured dot), and colour must never be the only signal that a row is failing. Every label is a react-i18next message, single words included, and API status enums are mapped to messages in the slice that owns the entity rather than printed as they arrive. Focus styling only matters once `asChild` turns it into a link or button, and then the `--ring` focus ring must stay visible.",
  },
  breadcrumb: {
    title: "Breadcrumb",
    description: "Displays the path to the current resource using a hierarchy of links.",
    demo: "BreadcrumbDemo",
    whenToUse:
      "`Breadcrumb` shows where the current screen sits in a hierarchy three or more levels deep and gives a way back up it. A two-level screen only needs a back link. It does not move between siblings, which is what `Tabs` and `Pagination` are for.",
    platformNotes:
      'The final crumb is `BreadcrumbPage`, which carries `aria-current="page"` and is deliberately not a link; turning it into one breaks the pattern for screen reader users. Separators are `aria-hidden`, so assistive tech hears just the trail, but the vendored `BreadcrumbEllipsis` contains a hardcoded sr-only `More` that has to be replaced with a react-i18next message. Crumb labels come from the entity\'s translated display name, never from the URL slug. Links render at `--muted-foreground` with the current page at `--foreground`; that pairing already clears AA, so do not lighten it further to make the trail recede.',
  },
  bubble: {
    title: "Bubble",
    description: "A chat bubble component for messaging UIs.",
    demo: "BubbleDemo",
    block: true,
    whenToUse:
      "`Bubble` is the surface for a single utterance in a conversational UI: chat, an agent transcript, an inline assistant panel. Nest it inside `Message` when the turn needs an avatar, author or timestamp; content that is not part of a conversation belongs in a `Card` or an `Item`.",
    platformNotes:
      "Variants resolve to semantic tokens, `default` to `--primary`, `secondary` and `muted` to the neutral surfaces, `destructive` to a `--destructive` tint, while `tinted` is derived from `--primary` with an oklch relative colour so it tracks a brand change on its own. Distinguish speakers with two variants, never a hardcoded colour. Only `BubbleContent` carries the fill: the variant classes target `*:data-[slot=bubble-content]`, so a background class on `Bubble` itself changes nothing. `BubbleReactions` is absolutely positioned and rings itself with `ring-card`, so it only reads correctly on a `bg-card` surface, and the reaction buttons are yours to make accessible: each needs an i18next label and a visible focus ring, neither of which the bare icon buttons in the demo have.",
  },
  button: {
    title: "Button",
    description: "Displays a button or a component that looks like a button.",
    demo: "ButtonDemo",
    whenToUse:
      "Use `Button` for anything that performs an action: submit, save, delete, open a dialog. If the control navigates, render a link (or `BreadcrumbLink` / `NavigationMenuLink`) styled as a button rather than a button that pushes a route. For a persistent on/off state reach for `Toggle`, and for two or three actions that read as one control use `ButtonGroup`.",
    platformNotes:
      "One `--primary` button per screen region: `destructive` is reserved for irreversible actions, and `secondary`, `outline` and `ghost` carry everything else. The `outline` variant carries `shadow-xs`, which compiles to a transparent value under the Platform theme, so the edge you see is the border, and adding a shadow utility of your own will paint nothing either. Every label, including the `aria-label` on an icon-only button, is a react-i18next message; an icon-only button with no label fails the WCAG 2.2 AA name requirement. Async submits need a real pending state (disabled plus `Spinner`), which is the loading state the design rules require, not an optional nicety.",
  },
  "button-group": {
    title: "Button Group",
    description: "Group multiple buttons together with separators and text slots.",
    demo: "ButtonGroupDemo",
    whenToUse:
      "Reach for `ButtonGroup` when two or three related actions belong together as one control: copy plus confirm, a value with an adjacent action, an input with a trailing button. When the members are mutually exclusive states, use `ToggleGroup` instead, and when there are more than about three choices, collapse them into a `DropdownMenu`.",
    platformNotes:
      "`ButtonGroupSeparator` paints `bg-input` rather than `--border`, one step darker, so the divider stays visible between two `outline` buttons that already have borders. Focus inside the group is raised with `z-index` on `focus-visible` instead of a shadow, which keeps the ring unclipped under the border plus `bg-card` elevation rule. `ButtonGroupText` (the `$ 99` slot in the demo) is a non-interactive label: it is not focusable and must not hold the action or a value users need to change. The group itself is `shared/ui`; which actions get grouped is a decision for the feature composing them, so that arrangement lives in the slice, not in the shared component.",
  },
  calendar: {
    title: "Calendar",
    description: "A date field component that allows users to enter and edit date.",
    demo: "CalendarDemo",
    block: true,
    whenToUse:
      "Use Calendar when the month itself is the interface: an availability grid, a booking screen, or a filter panel that stays open and shows which days are selectable. When the date is one field among many, put it behind a trigger with the [Date Picker](/docs/components/date-picker) recipe so the grid does not dominate the layout, and for a typed date or a value that carries a time use `Input` with a zod schema instead.",
    platformNotes:
      'Selected days and range endpoints paint with `--primary` / `--primary-foreground`, while `today` and the middle of a range use `--accent` / `--accent-foreground`, the same tint the theme uses for hover, so today and a hovered day read alike and a single `--accent` change moves both states: check light and dark after a theme bump. Month, weekday and caption text is formatted by react-day-picker (en-US by default) and the vendored month dropdown formatter calls `toLocaleString("default")`, which follows the browser locale rather than the active i18next language, so pass the matching `date-fns` locale on the `locale` prop and keep legends, hints and captions as translation messages. Focus renders on the day button itself (`--ring`, via `group-data-[focused=true]/day`), so leave that ring intact; the `disabled` day style is `text-muted-foreground` at 50% opacity, too faint to be the only signal that a day is unavailable, so pair it with a legend or helper text and show a `Skeleton` while the unavailable set is still loading. The `shadow-xs` on the caption dropdown compiles to nothing under the theme, so when a standalone month has to read as a raised surface, give it `border bg-card` (the demo settles for `rounded-md border`).',
  },
  card: {
    title: "Card",
    description: "Displays content and actions in a card, with a header, content, and footer.",
    demo: "CardDemo",
    block: true,
    whenToUse:
      "Card is the default container for a self-contained block on a Platform screen: a dashboard panel, a form section, a summary tile. Prefer it to a bare `div` with borders so every surface in the app matches. It is the wrong choice for a repeated list of records, where `Item` in an `ItemGroup` is lighter, and for anything that overlays the page, where `Dialog`, `Sheet` or `Popover` belong.",
    platformNotes:
      "Card is the canonical elevation in this theme: `border` plus `bg-card` and `text-card-foreground`, with no shadow. The vendored component still carries `shadow-sm`, which compiles to a fully transparent shadow because the theme overrides Tailwind's shadow scale, so leave the class in place (upstream source stays copy-pasteable) and do not reach for `shadow-md` expecting depth. `CardTitle` and `CardDescription` render as `div`, not headings, so pass a heading element through `CardTitle` (or wire `aria-labelledby`) when the card is a real section of the page. A card holding fetched data owns its states: skeleton inside `CardContent` with the header left intact so nothing jumps, plus a written empty state and an error path.",
  },
  carousel: {
    title: "Carousel",
    description: "A carousel with motion and slide effects built on Embla.",
    demo: "CarouselDemo",
    block: true,
    whenToUse:
      "A carousel suits browsable, order-agnostic content: screenshots, onboarding slides, a strip of promo cards on a dashboard. Anything a user must not miss or needs to compare goes in a `DataTable` or a wrapped grid, and a long list of peers scrolls better inside a `ScrollArea`.",
    platformNotes:
      "Autoplay is out of bounds: the motion contract in DESIGN.md rules out auto-rotating carousels, so do not add `embla-carousel-autoplay`, and slides move only on a click, swipe or arrow key. Embla animates with JavaScript transforms, which the theme's CSS `prefers-reduced-motion` block cannot neutralise, so pass `opts.duration: 0` when that query matches. The `sr-only` labels on `CarouselPrevious` and `CarouselNext` are English literals in the vendored file and are the only names a screen reader gets, so replace them with i18next messages. Watch the geometry too: the arrows sit at `-left-12` and `-right-12`, outside the frame, so give the wrapper horizontal room or move them inside at small breakpoints.",
  },
  chart: {
    title: "Chart",
    description: "Themed charts built on Recharts with shared tokens.",
    demo: "ChartDemo",
    block: true,
    whenToUse:
      "Charts earn their place when a trend or a comparison is faster to read than the numbers, typically two to five series on a dashboard. A single value or a delta reads better as a `Card` with typography. Data that people will scan, sort or export belongs in [Data Table](/docs/components/data-table), not in a chart.",
    platformNotes:
      "Series colour comes from the shared ramp `--chart-1` through `--chart-5` and never from `--accent` or another tint token: tints are hover surfaces and disappear against `bg-card`, which is why the demo config uses `var(--chart-1)` and `var(--chart-3)` (domain palettes such as Unit, Area or Teams stay in the app that owns them). That ramp is built from the functional palette, so `--chart-2` is the warning amber and `--chart-4` the error red: avoid both for a neutral series on a screen that also shows status, or the colour reads as an alert. Axis labels, legend entries and tooltip labels are i18next messages, and numbers, dates and units go through `Intl.NumberFormat` or `Intl.DateTimeFormat` for the active locale instead of concatenated strings. Recharts animates series on mount, which is motion without a state change: disable it (`isAnimationActive={false}`) under `prefers-reduced-motion`, and never let hue be the only thing separating two series.",
  },
  checkbox: {
    title: "Checkbox",
    description: "A control that allows the user to toggle between checked and not checked.",
    demo: "CheckboxDemo",
    whenToUse:
      "For independent boolean choices, and for multi-select lists where each row is on or off. When the boolean applies a setting immediately instead of being submitted with a form, use `Switch`; when the options are mutually exclusive, use `RadioGroup`.",
    platformNotes:
      "Radix renders a `button`, not a native `input`, so it takes no part in native form submission: bind it through a react-hook-form `Controller`, not `register`. Checked state fills with `--primary` and draws the Lucide check in `--primary-foreground`, while the indicator carries `transition-none` deliberately, so do not add a transition to fade the tick in. Give it an `id` and an associated `Label` or `FieldLabel` every time; adjacent text alone does not label a checkbox. Its label is a `t()` message like every other user-facing string.",
  },
  collapsible: {
    title: "Collapsible",
    description: "An interactive component which expands and collapses a panel.",
    demo: "CollapsibleDemo",
    whenToUse:
      "Reach for `Collapsible` for a single show/hide region: advanced options in a form, a filter panel above a table, extra detail under a summary row. Several sibling regions with their own headings are an `Accordion` instead, and content that should float over the page rather than push it down belongs in a `Popover` or `Sheet`.",
    platformNotes:
      "The demo runs it controlled (`open` plus `onOpenChange`) because the trigger label flips between two words; both of those are react-i18next messages, and lifting the state is what lets you pick the right one. Uncontrolled with `defaultOpen` is fine when the label never changes. Keep the trigger a real button (`asChild` onto `Button`, as the demo does) so it stays keyboard reachable with the `ring` outline and Radix can keep `aria-expanded` truthful. Its height animation is the `animate-collapsible-*` keyframes from `tw-animate-css`, already reduced to 1ms under `prefers-reduced-motion` by the theme's `base.css`.",
  },
  combobox: {
    title: "Combobox",
    description: "A searchable select built on the Command and Popover primitives.",
    demo: "ComboboxDemo",
    whenToUse:
      'Use when the list is long enough that the user should type to narrow it: people, projects, clients, anything past roughly fifteen entries. For a short fixed list use `Select` or `RadioGroup`; for a global "jump to" or action launcher use `Command` in a dialog, not this.',
    platformNotes:
      'This is a recipe rather than a shadcn component, `Popover` plus `Command` assembled by hand, so it is yours to maintain and it belongs in the slice that owns the data, not in `shared/ui`. It is fully controlled (`open` and the selected value both in state, no hidden input), so react-hook-form needs a `Controller`, and `CommandEmpty` is the only state the primitives give you: a skeleton while the options load and an error path for a failed fetch are on you. One token detail: the trigger is `Button variant="outline"`, which borders on `--border`, a step lighter than the `--input` used by `Input` and `SelectTrigger`, so add `border-input` to the trigger when it shares a row with them. The trigger placeholder, the search placeholder and the empty message are three separate user-facing strings, all of them `t()` calls.',
  },
  command: {
    title: "Command",
    description: "Fast, composable, unstyled command menu.",
    demo: "CommandDemo",
    block: true,
    whenToUse:
      "`Command` is for keyboard-first search across actions, records, or navigation targets, either inline as in the demo or wrapped in `CommandDialog` as a palette. To pick a value inside a form use `Combobox`, and for a short fixed list use `Select`.",
    platformNotes:
      "cmdk filters on rendered text, so under react-i18next it only matches the active locale; add a translated `keywords` list per item when users type English terms in a non-English UI. `CommandEmpty` is the mandatory empty state and its text is a translation message, as is the input placeholder, and the vendored file exports no loading wrapper, so a remote-backed palette renders its own skeleton and error rows inside `CommandList`. `CommandDialog` defaults `title` to `Command Palette` and `description` to `Search for a command to run...`, both hardcoded English and both the dialog's accessible name, so pass translated values in. Keep the palette shell in `shared/ui` and let each slice contribute its own item list, so the search surface does not accumulate knowledge of every domain.",
  },
  "context-menu": {
    title: "Context Menu",
    description: "Displays a menu of actions triggered by a right-click.",
    demo: "ContextMenuDemo",
    whenToUse:
      "Add `ContextMenu` as a secondary shortcut to actions that are already reachable another way, typically on a table row or a card. Right-click is not discoverable and does not exist on touch, so it must never be the only route to an action: pair it with the same items behind a `DropdownMenu` trigger.",
    platformNotes:
      'The trigger has to look like a target, which is why the demo gives it a dashed `border` and `text-muted-foreground`; an unmarked region leaves users with no way to know a menu exists. `inset` aligns items that have no icon with items that do, so keep it consistent inside a group instead of mixing the two. Keyboard users open it with the context-menu key or Shift+F10, meaning every action here must be operable from the keyboard alone to meet WCAG 2.2 AA. Item text and the `ContextMenuShortcut` labels come from react-i18next, and the destructive entry uses `variant="destructive"` rather than a hand-picked colour.',
  },
  "data-table": {
    title: "Data Table",
    description: "A slot-based table with sorting, drag-to-group, and column reorder or show/hide.",
    demo: "DataTableDemo",
    block: true,
    source: "package",
    group: "platform",
    whenToUse:
      "Reach for this when a Platform screen needs a working grid: click-to-sort, drag-to-group with collapsible sections and aggregates, column reorder, show/hide columns, and that arrangement remembered per user. If none of those apply, the plain `Table` is the right answer. If you need row virtualisation, server-driven pagination or row selection, build on TanStack Table directly instead of stretching this component.",
    platformNotes:
      "The package carries no shadcn, i18n or icon dependency: you supply `slots` (Table, Button, DropdownMenu), `icons` and `texts`, so the wired wrapper lives in `shared/ui` and `texts` is fed from `useTranslation`, including the function entries (`stopGrouping`, `columnsCount`). Sorting and grouping are computed client-side over the `rows` array you pass, so under server-side paging it only orders the current page: sort on the server and hand it `defaultSort` to match. Column order, visibility and grouping persist in `localStorage` under `dt:<tableId>:*`, which makes `tableId` a stable contract (reusing one across two grids crosses their state, and renaming a column key orphans the saved entry). On keyboard, header sorting is a real button, but column reorder and adding a group are HTML5 drag only and group rows toggle on row click, so give keyboard users another route to those if the grid is a primary workflow.",
  },
  "date-picker": {
    title: "Date Picker",
    description: "A date selection component built on Calendar and Popover.",
    demo: "DatePickerDemo",
    source: "recipe",
    composedFrom:
      "Compose it from `calendar` and `popover`, both of which are registry items:\n\n```bash\nnpx shadcn@latest add calendar popover\n```",
    whenToUse:
      "Compose Calendar inside a Popover when a date or a range is one field in a form or a filter bar and the month should stay out of the way until it is asked for. Reach for plain `Calendar` when the month must be permanently visible, and for a date entered as text or a value that includes a time use `Input` with a zod schema rather than stretching this pattern.",
    platformNotes:
      "This is a recipe, not a registry entry: `Calendar`, `Popover` and `Button` come from `shared/ui`, while the composed field lives in the slice that owns it and is exported through that slice's `index.ts`. Everything the trigger renders is user-facing, so the placeholder, the range separator and the `date-fns` pattern all come from i18next with the matching `date-fns` locale; the demo's hardcoded placeholder and `LLL d, y` pattern do not survive review. Selection is controlled in the demo while the popover's open state is not, and in `mode=\"range\"` the value passes through a state where `from` is set and `to` is still undefined, so guard on both before you submit and do not take over `open` just to close on the first click; the trigger is a `Button`, not a labelled input, so give it its own accessible name instead of relying on the formatted date. Keep `PopoverContent` at `w-auto p-0`: the default `w-72` is too narrow for `numberOfMonths={2}`, the calendar drops its own background inside `data-slot=popover-content`, and the popover border carries the elevation because its `shadow-md` paints nothing, so verify the two-month layout below `md` where the months stack into a column.",
  },
  dialog: {
    title: "Dialog",
    description: "A window overlaid on the primary window, rendering the content underneath inert.",
    demo: "DialogDemo",
    whenToUse:
      "Use a Dialog for a focused create or edit task the user should finish without losing the screen behind it, typically a short form with Save and Cancel. When the decision is destructive or irreversible, use `AlertDialog` instead so it cannot be dismissed by clicking outside; when the content is a long form or a detail panel, use `Sheet`.",
    platformNotes:
      "Elevation here is not a shadow: `DialogContent` ships `shadow-lg`, which the theme resolves to a transparent value, so the `bg-black/50` overlay and the content border are the only separation from the page. That matters in light mode, where `--background`, `--card` and `--popover` are all the same white, so never strip the border from `DialogContent`. Always render `DialogTitle` and `DialogDescription` (Radix uses them for the accessible name and description) and source every label, including the trigger and footer buttons, from react-i18next. The primitive stays in `shared/ui`; the form inside it belongs to the feature slice that owns the use case, wired with react-hook-form and zod.",
  },
  direction: {
    title: "Direction",
    description: "A text direction provider for RTL and LTR language support.",
    demo: "DirectionDemo",
    whenToUse:
      "`DirectionProvider` tells Radix primitives which side is start, so wrap the app in it as soon as a Platform app ships an RTL locale such as Arabic or Hebrew. Drive its value from the active react-i18next language rather than a fixed string; it renders nothing itself, so it is never the fix for a layout problem.",
    platformNotes:
      "The provider is context only. It flips Radix behaviour (menu arrow keys, popover side, slider direction) but does not set the `dir` attribute, so text does not actually flow right to left until the App Router root layout also puts `dir` on `<html>` from the current language. It belongs in `src/app` beside the i18n provider, never inside a feature. Everything under it should use logical utilities (`ms-*`, `me-*`, `text-start`, `inset-s-*`) in place of `ml-*` or `left-*`; `MessageScrollerButton` is the in-repo example, correcting its own centring with an `rtl:` variant.",
  },
  drawer: {
    title: "Drawer",
    description: "A panel that slides in from the edge of the screen.",
    demo: "DrawerDemo",
    whenToUse:
      "Use Drawer for a bottom sheet on touch and narrow viewports where dragging to dismiss is the expected gesture. On desktop, a side panel should be a `Sheet` and a centred task should be a `Dialog`; the common Platform pattern is Dialog above `md` and Drawer below, switched by a media query hook in `shared/hooks`.",
    platformNotes:
      "This is the one overlay in the family built on vaul rather than Radix, so its motion is drag driven transform rather than tw-animate-css, and direction is expressed as `data-vaul-drawer-direction` rather than a class per side. The drag handle only renders for the `bottom` direction, and the content is full width by default, which is why the demo wraps its children in `mx-auto w-full max-w-sm`. Surface is `bg-background` with a single border on the edge it is anchored to, and the `bg-black/50` overlay does the rest of the separating since shadows are neutralised. `DrawerTitle` and `DrawerDescription` are required for the accessible name, and every string in them is a react-i18next message.",
  },
  "dropdown-menu": {
    title: "Dropdown Menu",
    description: "Displays a menu of actions, triggered by a button.",
    demo: "DropdownMenuDemo",
    whenToUse:
      "`DropdownMenu` holds actions on the current record, row, or account behind an explicit trigger. It is not a form control: pick a value with `Select`, filter a long list with `Combobox`, and offer a right-click shortcut with `ContextMenu`.",
    platformNotes:
      'Content sits on `--popover` with items highlighting through `--accent`, and `variant="destructive"` on the item is the only correct way to colour a destructive entry; hand-applying `text-destructive` skips the matching hover and focus treatment. Radix runs its own enter and exit animation on the content, so do not add a `transition` class on top of it, and the theme already drops those animations under `prefers-reduced-motion`. Item labels, section labels, and shortcut hints are all react-i18next messages, and the modifier glyph must be resolved per platform rather than shipped as a literal Command symbol. Menu content that acts on a domain object belongs in the feature or entity slice that owns the object, while the primitives stay in `shared/ui`.',
  },
  empty: {
    title: "Empty",
    description: "An empty state component for no-data scenarios.",
    demo: "EmptyDemo",
    block: true,
    whenToUse:
      'Empty is the required no-data state for a list, table or search result, and it should distinguish "nothing here yet" (offer the create action) from "no matches" (offer clearing the filters). Use `Alert` when the reason is a failure rather than an absence, and `Skeleton` while the request is still in flight.',
    platformNotes:
      'One pitfall from the source: the base class sets `border-dashed` but no border width, so the dashed outline appears only if you add `border` yourself, which is why the demo passes `className="border rounded-lg"`. The API is slot based (`EmptyHeader` wrapping `EmptyMedia`, `EmptyTitle` and `EmptyDescription`, with `EmptyContent` for the action), and `EmptyMedia variant="icon"` renders a Lucide glyph on `bg-muted`: keep it decorative and let the title carry the meaning. Title, description and the action label are react-i18next messages, including the action verb. Each list owns its own empty state inside its slice, since the useful copy depends on what is missing and what the user can do about it.',
  },
  field: {
    title: "Field",
    description: "A form field component with labels, descriptions, and error messages.",
    demo: "FieldDemo",
    block: true,
    whenToUse:
      "The layout and semantics wrapper for every form in a Platform app: label, control, helper text and validation message as one group. Use it instead of hand-rolling a `div` with a `Label` and a `p`, and reach for `FieldSet` with `FieldLegend` when several controls answer one question.",
    platformNotes:
      '`FieldError` accepts an `errors` array of `{ message }` objects, the shape react-hook-form\'s `formState.errors` entries already have; it dedupes by message, renders `role="alert"`, and returns nothing when the array is empty, so it is safe to leave mounted. The invalid tint comes from `data-invalid="true"` on `Field`, which you set from form state: it is not inferred from the child control. `FieldLabel` carries `has-data-[state=checked]:border-primary` with a `bg-primary/5` fill, which is how you build a selectable option card here, since elevation is border plus `bg-card` and never a shadow. One correction to the upstream demo: it drops a bare `<input type="checkbox">` into the horizontal field, so use the `Checkbox` component instead and let it inherit the tokens.',
  },
  "hover-card": {
    title: "Hover Card",
    description: "For sighted users to preview information available behind a link.",
    demo: "HoverCardDemo",
    whenToUse:
      "A HoverCard previews an entity behind a link on pointer devices: the person, project or record a name refers to. It is a supplement and never the only route to that information; when the content is interactive or must be reachable by keyboard and touch, use `Popover`, and when it is a one line hint use `Tooltip`.",
    platformNotes:
      "Hover is the only trigger, so under WCAG 2.2 AA nothing in the card may be information the user cannot get another way, typically by following the link itself. It renders on the same `--popover` surface as `Popover`, which in light mode matches the page background, so the border is what separates it and should stay. When the card loads entity data on open it still owes the required states: a skeleton in place of the body and a quiet inline error, not a silent empty card. The card body is entity UI and belongs in the `entities/<name>/ui` slice while the primitive stays in `shared/ui`, with all copy resolved through react-i18next.",
  },
  input: {
    title: "Input",
    description: "Displays a form input field.",
    demo: "InputDemo",
    whenToUse:
      "The default single-line control for any short scalar value in a form: names, emails, quantities, references. Reach for `Textarea` when the value is multi-line prose, `InputGroup` when it needs a prefix, suffix or inline action, and `NativeSelect` or `Select` when the value comes from a fixed list.",
    platformNotes:
      "The control is `bg-transparent` with `border-input`, so `--input` is the entire affordance; `shadow-xs` sits in the class list but paints nothing, because the theme flattens the whole shadow scale to a transparent value. Validation styling hangs off `aria-invalid`, so a zod failure has to reach the DOM as `aria-invalid` (which the shadcn `Field` and `Form` wiring sets for you) rather than as a hand-added red border class. A placeholder is not a label: pair every `Input` with a `Label` or `FieldLabel`, and route the label, the placeholder and the error message through react-i18next `t()` calls. It lives in `shared/ui`; the form that composes it belongs to the feature or entity that owns the data.",
  },
  "input-group": {
    title: "Input Group",
    description: "An input component with prefix and suffix addons.",
    demo: "InputGroupDemo",
    whenToUse:
      "This is the wrapper when a text control needs something attached to it: a search icon, a unit or currency suffix, a URL scheme prefix, or a small inline button such as clear or reveal. A plain `Input` is enough with no affix, and a row of separate buttons beside a field is `ButtonGroup`, not this.",
    platformNotes:
      "Put `InputGroupInput` or `InputGroupTextarea` inside, never a bare `Input`: the wrapper owns the focus ring via `has-[[data-slot=input-group-control]:focus-visible]` while the inner control zeroes its own, so a plain `Input` gives you two rings and a group that never lights up. `InputGroupAddon` attaches an `onClick` that forwards focus to the sibling input (buttons inside it are excluded), which is what makes the whole group behave as one target. Border and the dark fill come from `--input` and addon text from `--muted-foreground`; the destructive state is lifted from the control's `aria-invalid` up to the wrapper, so set `aria-invalid` on the control and not on the group. Affix text such as a currency symbol or a unit is locale-dependent, so format it through i18n rather than hardcoding it, and give any icon-only `InputGroupButton` an accessible name.",
  },
  "input-otp": {
    title: "Input OTP",
    description: "A one-time password input built on the input-otp library.",
    demo: "InputOtpDemo",
    whenToUse:
      "For fixed-length codes typed or pasted in from another channel: two-factor confirmation, email verification, a short PIN. Anything of variable length is an `Input`, and a long-lived secret belongs in a password `Input`, not here.",
    platformNotes:
      "Visually it is a row of `div` slots, but the real control is a single hidden input, so react-hook-form binds one string and pasting the whole code works without extra handling. Slots share edges (`border-y border-r` with `first:border-l`), all on `--input`, and the active slot lifts to `--ring`, so a `className` that adds a full border will double every divider line. The blinking caret uses `animate-caret-blink`, and the theme's `base.css` already collapses animations under `prefers-reduced-motion`, so nothing extra is required for that. Since the slots are not labelled elements, label the group and put the instruction in a `FieldDescription`, both strings coming from react-i18next.",
  },
  item: {
    title: "Item",
    description: "A generic item component for lists and menus.",
    demo: "ItemDemo",
    block: true,
    whenToUse:
      "Item composes a row out of media, title, description and actions, which is what most Platform lists actually are: notifications, search results, integrations, settings rows. Wrap a set of them in `ItemGroup`. Use `Table` when the data is genuinely columnar and worth comparing across rows, and `Card` when a block deserves its own surface.",
    platformNotes:
      '`ItemGroup` sets `role="list"` but `Item` does not set `role="listitem"`, so add it (or make the item a real `li` via `asChild`) when the group is a semantic list. Variants resolve to `--border` for `outline` and `--muted` at 50% for `muted`, and the `accent` hover only applies to links: that tint is a surface, not a status colour. `ItemDescription` clamps at two lines, which bites in German and Spanish where the same message runs longer, so review the clamp against the translated string rather than the English one. When the whole row is actionable, make the target a link or button with the `--ring` focus ring instead of hanging `onClick` on the `Item` div, and keep any trailing control outside that target so controls are not nested.',
  },
  kbd: {
    title: "Kbd",
    description: "Represents keyboard input or hotkeys.",
    demo: "KbdDemo",
    whenToUse:
      "Kbd prints a key or a chord inline: help text, tooltips, command palette rows, menu items that advertise a shortcut. Use `KbdGroup` for multi-key chords. For inline code, a file path or a value, use a `<code>` element with `bg-muted`, not Kbd.",
    platformNotes:
      "Kbd only displays a shortcut, it never registers one: the handler belongs to the feature that owns the action, and the displayed key should be derived from the same source so the two cannot drift. Key names are user-facing text and go through react-i18next (`Enter`, `Shift`, `Esc`), while the modifier glyph depends on the client (Command on macOS, Ctrl elsewhere), so it is resolved at runtime rather than baked into a translation. The component is `bg-muted` with `text-muted-foreground`, `pointer-events-none`, and it inherits Outfit through `font-sans`, so it will not align with a mono code sample. Documenting a shortcut does not discharge the keyboard obligation: the same action still has to be reachable in tab order with a visible focus ring.",
  },
  label: {
    title: "Label",
    description: "Renders an accessible label associated with controls.",
    demo: "LabelDemo",
    whenToUse:
      "Names a single control when you are not inside a `Field`. Within the mandated form stack prefer `FieldLabel`, which is this component plus the `Field` grouping and disabled propagation; use `FieldSet` with `FieldLegend` when the thing being named is a group such as a `RadioGroup`.",
    platformNotes:
      "This is the Radix label primitive, so `htmlFor` must match the control `id` for click-to-focus and screen reader association to work, and nothing warns you at runtime if you forget. Its disabled dimming keys off `peer-disabled:` and `group-data-[disabled=true]:`, which only fire when the control is a sibling `peer` or an ancestor carries `data-disabled`, so a label wrapped in its own `div` stays at full opacity next to a disabled input. Label text is user-facing, which makes it a react-i18next message; never inline the string.",
  },
  marker: {
    title: "Marker",
    description: "A marker component for timestamps, separators, and section breaks.",
    demo: "MarkerDemo",
    whenToUse:
      'Marker annotates a point in a flow: a date stamp in an activity feed, an "Or continue with" divider between form sections, a labelled section break. When the boundary needs no label, `Separator` is simpler and cheaper. For state attached to a record, use `Badge`.',
    platformNotes:
      "All three variants draw only on `--muted-foreground` and `--border`, and the `separator` variant fakes its rules with `before`/`after` pseudo-elements, so it is decoration: it is not announced as a separator, and a boundary that carries meaning should use `Separator` with `decorative={false}` or a heading. `MarkerIcon` is `aria-hidden`, so the icon can never be the only carrier of information; whatever it signals must also appear in `MarkerContent`. Dates and labels inside a marker are localised: format the date through the active i18n locale rather than shipping the literal string the demo uses for illustration.",
  },
  menubar: {
    title: "Menubar",
    description: "A visually persistent menu giving quick access to a consistent set of commands.",
    demo: "MenubarDemo",
    block: true,
    whenToUse:
      "`Menubar` fits document-style surfaces with many grouped commands, an editor or an authoring view. Most Platform screens are CRUD and do not need it: use `Sidebar` for the app shell and `DropdownMenu` for a page's handful of actions.",
    platformNotes:
      'It has no responsive fallback and does not collapse, so any screen using it needs a separate small-viewport path through `Sidebar` or `DropdownMenu`. `MenubarShortcut` renders text only: the key handler is yours to register, and a displayed shortcut that nothing listens for is a defect users report. Menu titles, item labels, and shortcut strings are react-i18next messages, and destructive entries use `variant="destructive"` so they pick up the `--destructive` treatment on hover and focus.',
  },
  message: {
    title: "Message",
    description: "A message component for chat and messaging UIs with avatar alignment.",
    demo: "MessageDemo",
    block: true,
    whenToUse:
      '`Message` composes one turn: avatar, content, and optional header and footer, aligned by author. Give the current user `align="end"` and everyone else `align="start"`, and leave the surface styling to `Bubble`; when a turn carries no avatar or metadata, a `Bubble` on its own is enough.',
    platformNotes:
      "This is layout plus two tokens: `bg-muted` behind the avatar and `text-muted-foreground` for header and footer text. Alignment is a `data-align` attribute that reverses the flex row and is read by children through `group-data-[align=end]/message:`, which is why the demo sets `align` on both `Message` and its `Bubble`; setting it in one place only half works. Author names, status labels and relative times go through react-i18next and are formatted for the active locale, while the message body is user data and must never be passed to the translator. Keep `Message` in `shared/ui` and put the mapping from your conversation model onto it in the slice that owns the conversation, exposed through that slice's `index.ts`.",
  },
  "message-scroller": {
    title: "Message Scroller",
    description: "A scrollable message container with auto-scroll and jump-to-end button.",
    demo: "MessageScrollerDemo",
    block: true,
    whenToUse:
      "`MessageScroller` is for a live transcript: it holds the newest message in view while output streams in and reveals a jump-to-latest button once the user scrolls away. A bounded static list is a `ScrollArea` instead, and the turns inside the transcript are still `Message` and `Bubble`.",
    platformNotes:
      "It needs the full nesting (`Provider`, `Root`, `Viewport`, `Content`, `Item`) inside a parent with a resolved height, `h-80` in the demo, or autoscroll has nothing to measure and the button never activates. Unlike the rest of the catalog it pulls a runtime dependency, `@shadcn/react`, which is not in the ARCHITECTURE.md stack table, so record the deviation in the app before adopting it. `MessageScrollerItem` sets `content-visibility: auto` with an intrinsic size hint, so give images and embeds explicit dimensions or the transcript jumps as items render. The jump button ships a hardcoded English `sr-only` label that has to become an i18next message, and the viewport asks for a `scroll-fade-b` utility the theme does not define, so do not rely on that fade to signal more content.",
  },
  "native-select": {
    title: "Native Select",
    description: "A styled native HTML select element.",
    demo: "NativeSelectDemo",
    whenToUse:
      "Reach for this when you want the operating system's own picker: long option lists, dense data-entry forms, and mobile, where the native wheel beats a custom panel. Use `Select` for grouped items with icons or custom item rendering, and `Combobox` when the list needs a search box.",
    platformNotes:
      'The wrapper is `w-fit`, so inside a `Field` it will not stretch to match its neighbours; add `className="w-full"` when you want it to line up with the other controls in the column. Options are painted with the `Canvas` and `CanvasText` system colours because browsers do not let CSS reach into a native `<option>` list, which means the open popup will not follow your `dark` class: accept that instead of fighting it. The trigger sits on `--input` with the same `focus-visible` ring and `aria-invalid` states as `Input`, and the chevron is `aria-hidden`, so the accessible name still has to come from a `Label` bound by `htmlFor`. Option text is translated content, so build the list from `t()` values, not literals.',
  },
  "navigation-menu": {
    title: "Navigation Menu",
    description: "A collection of links for navigating between pages.",
    demo: "NavigationMenuDemo",
    block: true,
    whenToUse:
      "Use `NavigationMenu` for top-level navigation with grouped links, especially when a section needs a short description under its title. For switching panels inside one screen use `Tabs`, and for the shell of an internal Platform tool use `Sidebar`, which is the default there.",
    platformNotes:
      "`NavigationMenuLink` renders a plain anchor, so in a Next.js app pass `asChild` with a `next/link` child; the demo uses bare `href` values because the docs routes are static, and copying that pattern into an app costs you client-side navigation. `viewport={false}` (as in the demo) drops the shared animated viewport and positions each panel under its own item, which is what you want when panels differ noticeably in size. Panels use `--popover` for the surface and `--muted-foreground` for descriptions, both already AA against their background. The trigger chevron ships an upstream `transition duration-300`, longer than the 150ms ease-out contract; if you want it in line, change the vendored file rather than layering a second transition over it.",
  },
  pagination: {
    title: "Pagination",
    description: "A component for navigating between pages of content.",
    demo: "PaginationDemo",
    block: true,
    whenToUse:
      "Use `Pagination` for server-paged lists where the page belongs in the URL and users need to jump to a specific one. Client-side paging inside a table should use the `DataTable` controls instead, and an unbounded feed is better served by a load-more button.",
    platformNotes:
      'It renders anchors, so every page must be a real URL; give `PaginationLink` a `next/link` through `asChild` or you lose client-side navigation on each page change. The vendored source hardcodes `Previous`, `Next`, and the sr-only `More pages`, three user-facing strings that must be routed through react-i18next before the component ships in an app. `isActive` already sets `aria-current="page"` and switches the link to the `outline` button style, so do not add a second current-page marker. The list it pages needs both required states wired up: skeleton rows while the next page loads (never an emptied table) and an empty state when a filter returns nothing.',
  },
  popover: {
    title: "Popover",
    description: "Displays rich content in a portal, triggered by a button.",
    demo: "PopoverDemo",
    whenToUse:
      "Popover holds a small interactive layer anchored to the control that opened it: a filter, a quick edit, a colour or date choice. Use `Tooltip` when the content is a short non-interactive hint, `DropdownMenu` when it is a list of actions, and `Dialog` when the task deserves a focus trap and the page behind it should go inert.",
    platformNotes:
      "Content consumes `--popover` and `--popover-foreground`, and in light mode `--popover` is the same white as `--background`, so with `shadow-md` neutralised the border is the only thing that makes the popover look like a separate surface; do not remove it or swap the surface for `bg-background`. A Popover is not modal, so nothing inside is focus trapped: everything must be reachable by keyboard with a visible `ring`, and every input needs a real label. The enter and exit animation reads `--radix-popover-content-transform-origin`, so if you reposition the content with `align` or `sideOffset` the animation follows automatically and needs no extra transition. Keep the primitive in `shared/ui` and the popover body (a filter form, an entity picker) in the feature slice that owns it, with its strings coming from react-i18next.",
  },
  progress: {
    title: "Progress",
    description: "Displays an indicator showing the completion progress of a task.",
    demo: "ProgressDemo",
    whenToUse:
      "Use Progress when the completion ratio of a task is actually known: a file upload, a bulk import, a step counter through a wizard. When the duration is unknown use `Spinner`, and when content is loading in place use `Skeleton`.",
    platformNotes:
      "Track and bar are both brand tinted (`bg-primary/20` behind `bg-primary`); leave them that way and never reach for `--chart-*`, which is reserved for data series, or `--accent`, which is a hover surface. This copy has no indeterminate mode: with `value` omitted the indicator falls back to 0 and renders an empty track, which looks like a stalled task, so switch to `Spinner` rather than passing nothing. The bar is the only visual carrier of the number, so give the root an accessible name and render the percentage or step label beside it as a translated string. Its `transition-all` only ever animates `transform`, which is inside the motion contract, and the theme base layer already handles `prefers-reduced-motion`.",
  },
  "radio-group": {
    title: "Radio Group",
    description: "A set of checkable buttons where no more than one can be checked at a time.",
    demo: "RadioGroupDemo",
    whenToUse:
      "Pick this when a user chooses exactly one option from a short, visible set of roughly two to five. Above that, `Select` or `Combobox` scale better; for a plain on/off, use `Switch` or `Checkbox`.",
    platformNotes:
      'A per-item `Label` names the option but not the question, so wrap the group in `FieldSet` with `FieldLegend` to give it an accessible name. The unselected dot is `border-input` only and the selected one adds a `fill-primary` centre, so selection is a small colour-only mark: keep item labels clickable and do not shrink the item below `size-4`. The root is a `grid gap-3`, and `Field` already tightens its own gap when it detects a `data-slot="radio-group"` child, so leave that spacing alone rather than overriding it. As a Radix primitive it needs a `Controller` under react-hook-form.',
  },
  resizable: {
    title: "Resizable",
    description: "A set of resizable panels built on react-resizable-panels.",
    demo: "ResizableDemo",
    block: true,
    whenToUse:
      "Panels earn their place when a user genuinely rebalances two regions: a list beside a detail pane, an editor beside a preview, filters beside results. Fixed proportions should just be a grid, a temporary side surface is a `Sheet`, and collapsing app navigation is the `Sidebar`.",
    platformNotes:
      'Pass `withHandle` as the demo does: the bare separator is a 1px `bg-border` line with a 4px hit area, a demanding pointer target, and the grip is also what makes the focused `ring` visible. The separator is keyboard operable (focus it, then arrow keys resize), so re-test that after overriding its `className`. Sizes are percentages of the group, so verify at `sm` and `md`: two panes that work on a desktop become two unusable slivers on a phone, where stacking with `orientation="vertical"` or not resizing at all is the honest answer. Nothing divides the panes except that border, which is the intent here, since elevation is border plus `bg-card` and `shadow-*` paints nothing.',
  },
  "scroll-area": {
    title: "Scroll Area",
    description: "Custom scrollbars with consistent styling across browsers.",
    demo: "ScrollAreaDemo",
    block: true,
    whenToUse:
      "Wrap a bounded region in `ScrollArea` when it needs its own themed scrollbar: a long option list inside a `Popover`, an activity log, a column of many items. Let the page scroll natively when the whole screen is the scroll container, and use `MessageScroller` for a transcript that has to stay pinned to the newest entry.",
    platformNotes:
      "Scrolling only happens if the area has a resolved height (`h-60` in the demo); hand it a percentage or `auto` and it quietly stops clipping. The thumb is `bg-border` on a transparent track, deliberately quiet, so do not make it the only cue that more content exists: leave a row partly visible at the fold. The viewport itself is focusable and shows the `ring` outline, so keep it keyboard reachable instead of setting `tabIndex={-1}`. The mandatory states live around it: `Skeleton` rows while data loads and an `Empty` block when there is nothing, otherwise an empty scroll box reads as a bug.",
  },
  select: {
    title: "Select",
    description: "Displays a list of options for the user to pick from, triggered by a button.",
    demo: "SelectDemo",
    whenToUse:
      "The default choice for one value from a known list of roughly five to fifteen options, when you want the Platform dropdown surface with grouping and checkmarks. Below that count, `RadioGroup` shows everything at once; above it, or whenever a user would want to type to narrow, use `Combobox`; on dense data-entry or mobile-first screens `NativeSelect` is faster.",
    platformNotes:
      'This vendored copy defaults `SelectContent` to `position="item-aligned"` and `align="center"` rather than the upstream `popper`, so the panel overlays the trigger: pass `position="popper"` when you need it to sit below. Content renders through a Radix portal onto `--popover`, with item hover on `--accent`, which is exactly why `--accent` is a hover surface and not a value to reuse as a chart series or badge colour. The panel is `bg-popover` plus a border and no visible shadow, since `shadow-md` compiles to transparent here. Wrap the trigger in `Field` so it gets a label, set `aria-invalid` on it when the form reports an error, and take the `SelectValue` placeholder and every `SelectItem` label from react-i18next.',
  },
  separator: {
    title: "Separator",
    description: "Visually or semantically separates content.",
    demo: "SeparatorDemo",
    whenToUse:
      "A separator draws the line between groups of content or controls: sections inside a card, entries in a menu, inline metadata in a toolbar. Use it when the boundary is visual only. When the divider needs a label, use `Marker`; when blocks just need air between them, use margin rather than a line.",
    platformNotes:
      "It paints `bg-border`, the same `--border` token as card edges and table rules, so a separator inside a bordered surface aligns with the surface exactly. `decorative` defaults to `true`, which hides it from assistive tech: pass `decorative={false}` only when the line truly divides two independent regions, and prefer a heading or a `section` when the split is structural. Vertical orientation is a 1px full-height element, so it collapses to nothing unless the parent resolves a height (the demo wraps it in `flex h-5 items-center`). Do not use a separator as a stand-in for elevation: elevation here is `border-border` plus `bg-card`, and extra rules stacked inside a dense screen only add noise.",
  },
  sheet: {
    title: "Sheet",
    description: "A panel that slides out from the edge of the screen, extending a dialog.",
    demo: "SheetDemo",
    whenToUse:
      "A Sheet is the side panel for a secondary flow that should keep the current screen in view: record details, a filter panel, a multi-field form too tall for a centred window. Use `Dialog` when the content is short and belongs in the middle of the screen, and `Drawer` when it needs to be a draggable bottom sheet on touch devices.",
    platformNotes:
      "The `side` prop decides which single edge gets a border (`border-l` for the default right side, `border-t` for bottom), and since `shadow-lg` paints nothing that one border is the entire boundary against the page; keep it when you override `className`. The surface is `bg-background`, which in dark mode (`#0d0e0f`) sits below `--card` (`#17181b`), so a card placed inside the sheet reads as raised without any shadow. `SheetTitle` and `SheetDescription` are the accessible name and description, not decoration, and both strings come from react-i18next. Panel content that fetches needs the full set of states: skeleton while loading, empty when there is nothing, and an inline error, all owned by the slice that renders them.",
  },
  sidebar: {
    title: "Sidebar",
    description: "A composable, collapsible sidebar with a provider and many sub-parts.",
    demo: "SidebarDemo",
    block: true,
    whenToUse:
      "`Sidebar` is the default app shell for a Platform tool: persistent primary navigation, collapsible to icons. Use `Sheet` when the panel is temporary and task-scoped, and `Menubar` or `NavigationMenu` when what you need is a command surface rather than a shell.",
    platformNotes:
      'It consumes the whole `--sidebar-*` token group and renders unstyled without it; the theme sets `--sidebar` to `--pc-neutral-100` rather than neutral-50 because neutral-50 reads at 1.04:1 against white and is not perceptible as a separate surface, with `--sidebar-border` carrying the boundary and `--sidebar-accent` the active item. `SidebarProvider` writes collapse state to a `sidebar_state` cookie and binds Ctrl/Cmd+B, so it must be a client component (hence `"use client"` in the demo), and to avoid a flash on first paint read that cookie in the server layout and pass `defaultOpen`. Below `md` it swaps to a `Sheet` whose sr-only title is the hardcoded string `Sidebar`, and `SidebarTrigger` ships a hardcoded `Toggle Sidebar` label: both are user-facing accessible names and need react-i18next. `SidebarMenuSkeleton` is the built-in loading state for a nav tree built from fetched data, and the nav tree itself is composed in `app/` or the widget owning the shell, not inside `shared/ui`.',
  },
  skeleton: {
    title: "Skeleton",
    description: "Used to show a placeholder while content is loading.",
    demo: "SkeletonDemo",
    whenToUse:
      "Skeleton is the mandated loading state for content that will appear in place: lists, cards, tables, detail panels. Use `Spinner` for a wait attached to a control such as a submitting button, and `Progress` when you know how far along the work is.",
    platformNotes:
      "Painted with `bg-accent`, which is a blue tint in this theme (blue-100 in light, `#17244a` in dark) and doubles as the hover surface, so a skeleton row can match the colour of a hovered row above it; that is the theme working as designed, do not swap in `--muted` per component. No `motion-safe:` guard is needed on `animate-pulse`: the theme's base layer collapses animation to 1ms with a single iteration under `prefers-reduced-motion: reduce`, so this is handled once for the whole app. Size each skeleton to the real element it stands in for (the demo mirrors an avatar plus two text lines) so nothing shifts when data arrives. Skeletons live next to the component they replace, in the slice that owns it, not in a shared collection of loading screens.",
  },
  slider: {
    title: "Slider",
    description: "An input where the user selects a value from a given range.",
    demo: "SliderDemo",
    whenToUse:
      "Good for imprecise, continuous values where the visual position is the point: opacity, zoom, a price band, a threshold someone is tuning. When an exact figure matters use a numeric `Input`, and when both matter, pair the slider with an `Input` bound to the same value.",
    platformNotes:
      "A gotcha in this copy: the thumb is `bg-white` with `border-primary`, hardcoded rather than tokenised, so it does not follow dark mode; switch it to `bg-background` if you re-vendor the file. The track is `--muted` and the filled range is `--primary`, a colour-only signal, so the current value has to be rendered as text near the control as well. It renders no label of its own, so supply an `aria-label` or an `aria-labelledby` pointing at a `FieldLabel`, and check that the hover-to-`ring-4` growth still reads as focus rather than decoration. Thumbs are keyed by their value, so a range slider whose two handles land on the same number produces a duplicate React key.",
  },
  spinner: {
    title: "Spinner",
    description: "A loading spinner component.",
    demo: "SpinnerDemo",
    whenToUse:
      "Use Spinner for an indeterminate wait tied to a control or a small region: a submitting button, an inline refresh, a panel too small for a skeleton. For a screen or section of content that is loading, use `Skeleton`; when the ratio is known, use `Progress`.",
    platformNotes:
      'Under the hood this is a Lucide `Loader2Icon` with `role="status"` and a hardcoded English `aria-label="Loading"`: override it with a translated message, otherwise a magic string ships straight into the accessibility tree. Because the theme stops `animate-spin` after one iteration under reduced motion, a spinner on its own is not a visible wait indicator for those users, so pair it with text or a disabled control the way the demo pairs it with a disabled Button. It takes `currentColor`, so inside a button it inherits the correct foreground with no token work; size it with `size-*` rather than width and height utilities.',
  },
  switch: {
    title: "Switch",
    description: "A control that toggles between checked and not checked.",
    demo: "SwitchDemo",
    whenToUse:
      "A setting that takes effect the moment it is flipped belongs here: a notification preference, a feature toggle, a display option. If the value is submitted with the rest of a form, use `Checkbox`; if flipping it is destructive or slow, use a `Button` plus `AlertDialog` so the action stays explicit.",
    platformNotes:
      'The unchecked track is filled with `--input`, a low-contrast surface against `--background`, so "off" is carried mostly by thumb position: an associated `Label` is required, and state must be legible as text rather than colour. Because the toggle writes immediately, it owes a pending path and a failure path: disable it while the write is in flight, then revert and surface an error if it fails. The thumb animates `transform` only, which matches the motion contract, and the theme\'s `base.css` collapses that animation globally under `prefers-reduced-motion`, so no per-component handling is needed.',
  },
  table: {
    title: "Table",
    description: "A responsive table component.",
    demo: "TableDemo",
    block: true,
    whenToUse:
      "Use `Table` for a read-only tabular set that fits on a screen and needs no sorting, grouping or column control: a summary panel, an invoice line list, a config dump. The moment users need to sort, group, reorder or hide columns, move to [Data Table](/docs/components/data-table) rather than hand-rolling those behaviours on top. For records that read as a title plus description plus actions, `Item` inside an `ItemGroup` is a better fit than a two-column table.",
    platformNotes:
      "The primitives paint row rules with `--border`, hover and footer with `--muted` at 50%, and header cells with `--foreground`; nothing here is elevated, so the surface around it is `bg-card` plus `border-border`. Both `TableHead` and `TableCell` set `whitespace-nowrap` and the wrapper is `overflow-x-auto`, so a wide table scrolls sideways instead of wrapping: cap the offending column with `max-w-*` and truncate if you need it to fit. Column headers, cell copy and the caption are all react-i18next messages, and status enums arriving from the API get mapped to messages in the slice rather than rendered raw. Table itself belongs in `shared/ui`, while the column set and cell renderers for one screen belong to the slice that owns that screen, and that slice owes the table a skeleton, an empty row and an error path, since the component renders only the rows you hand it.",
  },
  tabs: {
    title: "Tabs",
    description: "A set of layered sections of content, shown one at a time.",
    demo: "TabsDemo",
    block: true,
    whenToUse:
      "`Tabs` switches between panels of content that all belong to the same object, on one screen. Do not use it for steps in a process (use an explicit stepper or a multi-page form) or for sections that should be linkable, which belong to real routes with `NavigationMenu` or a Next.js segment layout.",
    platformNotes:
      "`TabsList` sits on `--muted` with the active trigger on `--background`, so a list placed on a muted card surface loses its contrast: put it on `bg-card` or switch the list to the `line` variant. The demo is uncontrolled via `defaultValue`; a controlled version needs `value` and `onValueChange`, and syncing that to a search param is preferred as soon as anyone wants to link a specific tab. Radix unmounts inactive panels, so react-hook-form state inside a tab is lost on switch unless the form lives at the `Tabs` level. Each panel owns its own loading, empty, and error states; a tab that fetches on activation shows a skeleton, not a blank region.",
  },
  textarea: {
    title: "Textarea",
    description: "Displays a form textarea field.",
    demo: "TextareaDemo",
    whenToUse:
      "Use for free-form multi-line input: comments, descriptions, internal notes. If the value is a single short string, use `Input`; if it needs a character counter or an inline send button, compose it as `InputGroupTextarea` inside an `InputGroup`.",
    platformNotes:
      "`field-sizing-content` with `min-h-16` means the box grows with its content, and that growth stays untransitioned on purpose: the motion contract forbids animating `height`. Border comes from `--input` and the placeholder from `--muted-foreground`, with the same `aria-invalid` destructive treatment as `Input`. Long-form text is the most likely place for a save that can fail, so the surrounding form owes an explicit pending state and an error state, not just the happy path.",
  },
  toast: {
    title: "Toast",
    description: "A succinct message that is displayed temporarily.",
    demo: "ToastDemo",
    whenToUse:
      "Use a toast to confirm that an action the user already left behind has finished, or to report a non-blocking failure with a retry. If the message must stay on screen until it is resolved, use `Alert`; if the user has to decide before anything continues, use `AlertDialog`.",
    platformNotes:
      "sonner is the mandated toast library for Platform apps per ARCHITECTURE.md; the copy previewed in this catalog is the Radix based `Toast` with a `use-toast` hook, so follow whichever one your app installed and do not run both. Mount the toaster exactly once, in the providers module under `app/`, never inside a view. Title, description and action label are all react-i18next messages, and the action needs an `altText` for screen readers as the demo shows. Because shadows paint nothing, a toast is separated from the page by its border and surface: the destructive variant switches to `--destructive`, so check the contrast of any action button you place inside it.",
  },
  toggle: {
    title: "Toggle",
    description: "A two-state button that can be toggled on or off.",
    demo: "ToggleDemo",
    whenToUse:
      "`Toggle` is for a single independent on/off control that acts on content, formatting-style: underline, mute, pin. Use `Switch` for a setting that reads as on/off in prose and applies immediately, `Checkbox` when the value is a form field, and `ToggleGroup` when the options are exclusive.",
    platformNotes:
      'The pressed state paints `--accent` with `--accent-foreground`, which is also the hover surface, so a default-variant toggle sitting on an `--accent` or `--sidebar-accent` background has no visible pressed state; use `variant="outline"` there, as the demo does for three of its four toggles. Radix supplies `aria-pressed`, so never render your own "on" / "off" text next to it. Each toggle carries an `aria-label` because the content is often just a Lucide icon, and that label is a react-i18next message like every other user-facing string.',
  },
  "toggle-group": {
    title: "Toggle Group",
    description: "A set of two-state buttons that can be toggled on or off.",
    demo: "ToggleGroupDemo",
    whenToUse:
      "Use `ToggleGroup` for choosing from a small set that stays visible: a view switcher, alignment, a 7 / 30 / 90 day range. Past roughly five options move to `Select`, and if the choice swaps panels of content rather than a value, use `Tabs`.",
    platformNotes:
      '`variant` and `size` are set once on the group and reach the items through React context, so passing them per item is silently ignored; the demo sets `variant="outline"` on `ToggleGroup` only. It is uncontrolled through `defaultValue` in the demo; a controlled group needs `value` plus `onValueChange`, and `type="single"` emits an empty string when the active item is deselected, so guard that before it reaches a TanStack Query key or a URL param. Every item needs a translated `aria-label` (`Align left` in the demo is a magic string that must become an i18next message), and the group needs its own accessible name when the icons alone do not say what is being chosen.',
  },
  tooltip: {
    title: "Tooltip",
    description: "A popup that displays information when hovering or focusing an element.",
    demo: "TooltipDemo",
    whenToUse:
      "Use a Tooltip to name an icon-only control or add a short hint next to a label. It must never carry information the user needs to complete a task; if the content is interactive, longer than a line, or needs to be readable on touch, use `Popover` or `HoverCard`.",
    platformNotes:
      "Alone among these overlays, tooltip content is an inverted surface (`bg-foreground` with `text-background`) rather than `--popover`, so it needs no border to stand out and the arrow is already included in `TooltipContent`. Mount a single `TooltipProvider` in the providers module under `app/` rather than per component as the preview does for isolation, and note that `delayDuration` defaults to `0` in the vendored copy, so tooltips appear immediately unless you raise it. An icon-only button still needs its own accessible name (an `sr-only` span or `aria-label`); a tooltip is not a substitute for a label, and both strings are separate react-i18next messages.",
  },
  typography: {
    title: "Typography",
    description: "Themed text elements (headings, lists, code, quotes) using Platform tokens.",
    demo: "TypographyDemo",
    block: true,
    source: "none",
    whenToUse:
      "This page is the reference for prose in a Platform app: headings, paragraphs, lists, blockquotes and inline code, all done with Tailwind utilities rather than an imported component. Apply these classes to long-form content such as release notes, help pages and empty-state copy. On a dense data screen the type comes from the components themselves (`CardTitle`, `ItemTitle`, `Table`), which you should not restyle with heading classes.",
    platformNotes:
      "There is no Typography component to install: the look is `--font-sans` (Outfit) with `--foreground` and `--muted-foreground`, and the intended rhythm is the scale in `DESIGN.md` (h1 20/25, body 16/24 and 14/24, small 12/15), which is tighter than Tailwind's default steps, so check a screen against it instead of assuming. Heading level is document structure, not size: pick `h2` because of where it sits in the outline and change the appearance with a class, since skipping from `h1` to `h4` breaks the structure even when it looks right. Prose is the biggest source of untranslated strings in practice, so it lives in i18next resources, with interpolation for values and `Trans` for inline markup rather than concatenation. Sizes come from Tailwind's rem-based utilities so text still grows under browser zoom: avoid px overrides in a `style` prop, which is what breaks the 200% zoom requirement.",
  },
};
