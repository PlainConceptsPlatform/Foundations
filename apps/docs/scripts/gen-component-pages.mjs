// One-off/maintenance generator: creates content/docs/components/<slug>.mdx pages from
// components/previews/<slug>-demo.tsx. Re-run manually (`node scripts/gen-component-pages.mjs`)
// after adding a new preview demo. Not wired into predev/prebuild.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const previewsDir = resolve(here, "../components/previews");
const outDir = resolve(here, "../content/docs/components");

// slug -> { title, description, demo: componentName }
const COMPONENTS = {
  accordion: {
    title: "Accordion",
    description:
      "A vertically stacked set of interactive headings that each reveal a section of content.",
    demo: "AccordionDemo",
  },
  alert: {
    title: "Alert",
    description: "Displays a callout for user attention.",
    demo: "AlertDemo",
  },
  "alert-dialog": {
    title: "Alert Dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
    demo: "AlertDialogDemo",
  },
  "aspect-ratio": {
    title: "Aspect Ratio",
    description: "Displays content within a desired ratio.",
    demo: "AspectRatioDemo",
  },
  attachment: {
    title: "Attachment",
    description: "A file attachment component with upload states and media preview.",
    demo: "AttachmentDemo",
  },
  avatar: {
    title: "Avatar",
    description: "An image element with a fallback for representing the user.",
    demo: "AvatarDemo",
  },
  badge: {
    title: "Badge",
    description: "Displays a badge or a component that looks like a badge.",
    demo: "BadgeDemo",
  },
  breadcrumb: {
    title: "Breadcrumb",
    description: "Displays the path to the current resource using a hierarchy of links.",
    demo: "BreadcrumbDemo",
  },
  bubble: {
    title: "Bubble",
    description: "A chat bubble component for messaging UIs.",
    demo: "BubbleDemo",
  },
  button: {
    title: "Button",
    description: "Displays a button or a component that looks like a button.",
    demo: "ButtonDemo",
  },
  "button-group": {
    title: "Button Group",
    description: "Group multiple buttons together with separators and text slots.",
    demo: "ButtonGroupDemo",
  },
  calendar: {
    title: "Calendar",
    description: "A date field component that allows users to enter and edit date.",
    demo: "CalendarDemo",
  },
  card: {
    title: "Card",
    description: "Displays content and actions in a card, with a header, content, and footer.",
    demo: "CardDemo",
  },
  carousel: {
    title: "Carousel",
    description: "A carousel with motion and slide effects built on Embla.",
    demo: "CarouselDemo",
  },
  chart: {
    title: "Chart",
    description: "Themed charts built on Recharts with shared tokens.",
    demo: "ChartDemo",
  },
  checkbox: {
    title: "Checkbox",
    description: "A control that allows the user to toggle between checked and not checked.",
    demo: "CheckboxDemo",
  },
  collapsible: {
    title: "Collapsible",
    description: "An interactive component which expands/collapses a panel.",
    demo: "CollapsibleDemo",
  },
  combobox: {
    title: "Combobox",
    description: "A searchable select built on the Command and Popover primitives.",
    demo: "ComboboxDemo",
  },
  command: {
    title: "Command",
    description: "Fast, composable, unstyled command menu.",
    demo: "CommandDemo",
  },
  "context-menu": {
    title: "Context Menu",
    description:
      "Displays a menu to the user — such as a set of actions or functions — triggered by a right-click.",
    demo: "ContextMenuDemo",
  },
  "data-table": {
    title: "Data Table",
    description: "A sortable table built on the Table primitive and TanStack Table.",
    demo: "DataTableDemo",
  },
  "date-picker": {
    title: "Date Picker",
    description: "A date selection component built on Calendar and Popover.",
    demo: "DatePickerDemo",
  },
  dialog: {
    title: "Dialog",
    description: "A window overlaid on the primary window, rendering the content underneath inert.",
    demo: "DialogDemo",
  },
  direction: {
    title: "Direction",
    description: "A text direction provider for RTL/LTR language support.",
    demo: "DirectionDemo",
  },
  drawer: {
    title: "Drawer",
    description: "A panel that slides in from the edge of the screen.",
    demo: "DrawerDemo",
  },
  "dropdown-menu": {
    title: "Dropdown Menu",
    description: "Displays a menu to the user, such as a set of actions, triggered by a button.",
    demo: "DropdownMenuDemo",
  },
  empty: {
    title: "Empty",
    description: "An empty state component for no-data scenarios.",
    demo: "EmptyDemo",
  },
  field: {
    title: "Field",
    description: "A form field component with labels, descriptions, and error messages.",
    demo: "FieldDemo",
  },
  "hover-card": {
    title: "Hover Card",
    description: "For sighted users to preview information available behind a link.",
    demo: "HoverCardDemo",
  },
  input: { title: "Input", description: "Displays a form input field.", demo: "InputDemo" },
  "input-group": {
    title: "Input Group",
    description: "An input component with prefix and suffix addons.",
    demo: "InputGroupDemo",
  },
  "input-otp": {
    title: "Input OTP",
    description: "A one-time password input built on the input-otp library.",
    demo: "InputOtpDemo",
  },
  item: {
    title: "Item",
    description: "A generic item component for lists and menus.",
    demo: "ItemDemo",
  },
  kbd: {
    title: "Kbd",
    description: "Represents keyboard input or hotkeys.",
    demo: "KbdDemo",
  },
  label: {
    title: "Label",
    description: "Renders an accessible label associated with controls.",
    demo: "LabelDemo",
  },
  marker: {
    title: "Marker",
    description: "A marker component for timestamps, separators, and section breaks.",
    demo: "MarkerDemo",
  },
  menubar: {
    title: "Menubar",
    description:
      "A visually persistent menu that allows quick access to a consistent set of commands.",
    demo: "MenubarDemo",
  },
  message: {
    title: "Message",
    description: "A message component for chat and messaging UIs with avatar alignment.",
    demo: "MessageDemo",
  },
  "message-scroller": {
    title: "Message Scroller",
    description: "A scrollable message container with auto-scroll and jump-to-end button.",
    demo: "MessageScrollerDemo",
  },
  "native-select": {
    title: "Native Select",
    description: "A styled native HTML select element.",
    demo: "NativeSelectDemo",
  },
  "navigation-menu": {
    title: "Navigation Menu",
    description: "A collection of links for navigating between pages.",
    demo: "NavigationMenuDemo",
  },
  pagination: {
    title: "Pagination",
    description: "A component for navigating between pages of content.",
    demo: "PaginationDemo",
  },
  popover: {
    title: "Popover",
    description: "Displays rich content in a portal, triggered by a button.",
    demo: "PopoverDemo",
  },
  progress: {
    title: "Progress",
    description: "Displays an indicator showing the completion progress of a task.",
    demo: "ProgressDemo",
  },
  "radio-group": {
    title: "Radio Group",
    description: "A set of checkable buttons where no more than one can be checked at a time.",
    demo: "RadioGroupDemo",
  },
  resizable: {
    title: "Resizable",
    description: "A set of resizable panels built on react-resizable-panels.",
    demo: "ResizableDemo",
  },
  "scroll-area": {
    title: "Scroll Area",
    description: "Custom scrollbars with consistent styling across browsers.",
    demo: "ScrollAreaDemo",
  },
  select: {
    title: "Select",
    description: "Displays a list of options for the user to pick from, triggered by a button.",
    demo: "SelectDemo",
  },
  separator: {
    title: "Separator",
    description: "Visually or semantically separates content.",
    demo: "SeparatorDemo",
  },
  sheet: {
    title: "Sheet",
    description: "A panel that slides out from the edge of the screen, extending a dialog.",
    demo: "SheetDemo",
  },
  sidebar: {
    title: "Sidebar",
    description: "A composable, collapsible sidebar with a provider and many sub-parts.",
    demo: "SidebarDemo",
  },
  skeleton: {
    title: "Skeleton",
    description: "Used to show a placeholder while content is loading.",
    demo: "SkeletonDemo",
  },
  slider: {
    title: "Slider",
    description: "An input where the user selects a value from a given range.",
    demo: "SliderDemo",
  },
  spinner: {
    title: "Spinner",
    description: "A loading spinner component.",
    demo: "SpinnerDemo",
  },
  switch: {
    title: "Switch",
    description: "A control that toggles between checked and not checked.",
    demo: "SwitchDemo",
  },
  table: { title: "Table", description: "A responsive table component.", demo: "TableDemo" },
  tabs: {
    title: "Tabs",
    description: "A set of layered sections of content, shown one at a time.",
    demo: "TabsDemo",
  },
  textarea: {
    title: "Textarea",
    description: "Displays a form textarea field.",
    demo: "TextareaDemo",
  },
  toast: {
    title: "Toast",
    description: "A succinct message that is displayed temporarily.",
    demo: "ToastDemo",
  },
  toggle: {
    title: "Toggle",
    description: "A two-state button that can be toggled on or off.",
    demo: "ToggleDemo",
  },
  "toggle-group": {
    title: "Toggle Group",
    description: "A set of two-state buttons that can be toggled on or off.",
    demo: "ToggleGroupDemo",
  },
  tooltip: {
    title: "Tooltip",
    description: "A popup that displays information when hovering or focusing an element.",
    demo: "TooltipDemo",
  },
  typography: {
    title: "Typography",
    description: "Themed text elements — headings, lists, code, quotes — using Platform tokens.",
    demo: "TypographyDemo",
    plain: true,
  },
};

function esc(s) {
  return s.replace(/"/g, '\\"');
}

const slugs = Object.keys(COMPONENTS);
for (const slug of slugs) {
  const meta = COMPONENTS[slug];
  const source = readFileSync(resolve(previewsDir, `${slug}-demo.tsx`), "utf8").trimEnd();
  const mdx = `---
title: "${esc(meta.title)}"
description: "${esc(meta.description)}"
---

import { ${meta.demo} } from "@/components/previews/${slug}-demo"

## Installation

\`\`\`bash
npx shadcn@latest add ${slug}
\`\`\`

## Usage

\`\`\`tsx
${source}
\`\`\`

## Preview

<div className="my-4 flex flex-wrap items-center gap-4 rounded-lg border border-border p-6">
  <${meta.demo} />
</div>

## Full API

[ui.shadcn.com/docs/components/${slug}](https://ui.shadcn.com/docs/components/${slug})
`;
  writeFileSync(resolve(outDir, `${slug}.mdx`), mdx);
}

writeFileSync(
  resolve(outDir, "meta.json"),
  `${JSON.stringify(
    {
      title: "Components",
      pages: [
        "---Plain---",
        "plain-logo",
        ...slugs.filter((s) => COMPONENTS[s].plain),
        "---Shadcn---",
        ...slugs.filter((s) => !COMPONENTS[s].plain),
      ],
    },
    null,
    2,
  )}\n`,
);

console.log(`[gen-component-pages] wrote ${slugs.length} component pages`);
