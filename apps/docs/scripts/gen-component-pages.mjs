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
  accordion: { title: "Accordion", description: "A vertically stacked set of interactive headings that each reveal a section of content.", demo: "AccordionDemo" },
  alert: { title: "Alert", description: "Displays a callout for user attention.", demo: "AlertDemo" },
  "alert-dialog": { title: "Alert Dialog", description: "A modal dialog that interrupts the user with important content and expects a response.", demo: "AlertDialogDemo" },
  avatar: { title: "Avatar", description: "An image element with a fallback for representing the user.", demo: "AvatarDemo" },
  badge: { title: "Badge", description: "Displays a badge or a component that looks like a badge.", demo: "BadgeDemo" },
  breadcrumb: { title: "Breadcrumb", description: "Displays the path to the current resource using a hierarchy of links.", demo: "BreadcrumbDemo" },
  button: { title: "Button", description: "Displays a button or a component that looks like a button.", demo: "ButtonDemo" },
  calendar: { title: "Calendar", description: "A date field component that allows users to enter and edit date.", demo: "CalendarDemo" },
  card: { title: "Card", description: "Displays content and actions in a card, with a header, content, and footer.", demo: "CardDemo" },
  checkbox: { title: "Checkbox", description: "A control that allows the user to toggle between checked and not checked.", demo: "CheckboxDemo" },
  command: { title: "Command", description: "Fast, composable, unstyled command menu.", demo: "CommandDemo" },
  dialog: { title: "Dialog", description: "A window overlaid on the primary window, rendering the content underneath inert.", demo: "DialogDemo" },
  drawer: { title: "Drawer", description: "A panel that slides in from the edge of the screen.", demo: "DrawerDemo" },
  "dropdown-menu": { title: "Dropdown Menu", description: "Displays a menu to the user, such as a set of actions, triggered by a button.", demo: "DropdownMenuDemo" },
  input: { title: "Input", description: "Displays a form input field.", demo: "InputDemo" },
  label: { title: "Label", description: "Renders an accessible label associated with controls.", demo: "LabelDemo" },
  popover: { title: "Popover", description: "Displays rich content in a portal, triggered by a button.", demo: "PopoverDemo" },
  progress: { title: "Progress", description: "Displays an indicator showing the completion progress of a task.", demo: "ProgressDemo" },
  "radio-group": { title: "Radio Group", description: "A set of checkable buttons where no more than one can be checked at a time.", demo: "RadioGroupDemo" },
  select: { title: "Select", description: "Displays a list of options for the user to pick from, triggered by a button.", demo: "SelectDemo" },
  separator: { title: "Separator", description: "Visually or semantically separates content.", demo: "SeparatorDemo" },
  sheet: { title: "Sheet", description: "A panel that slides out from the edge of the screen, extending a dialog.", demo: "SheetDemo" },
  skeleton: { title: "Skeleton", description: "Used to show a placeholder while content is loading.", demo: "SkeletonDemo" },
  slider: { title: "Slider", description: "An input where the user selects a value from a given range.", demo: "SliderDemo" },
  sonner: { title: "Sonner", description: "An opinionated toast component.", demo: "SonnerDemo" },
  switch: { title: "Switch", description: "A control that toggles between checked and not checked.", demo: "SwitchDemo" },
  table: { title: "Table", description: "A responsive table component.", demo: "TableDemo" },
  tabs: { title: "Tabs", description: "A set of layered sections of content, shown one at a time.", demo: "TabsDemo" },
  textarea: { title: "Textarea", description: "Displays a form textarea field.", demo: "TextareaDemo" },
  tooltip: { title: "Tooltip", description: "A popup that displays information when hovering or focusing an element.", demo: "TooltipDemo" },
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
      pages: ["---Plain---", "plain-logo", "---Shadcn---", ...slugs],
    },
    null,
    2,
  )}\n`,
);

console.log(`[gen-component-pages] wrote ${slugs.length} component pages`);
