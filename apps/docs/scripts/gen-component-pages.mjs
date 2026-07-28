// Generates content/docs/components/<slug>.mdx from components/previews/<slug>-demo.tsx.
//
// Everything a catalog page says lives in the COMPONENTS map below, so the whole
// catalog can be restyled or re-voiced from one file and stays reviewable in one diff.
//
// Page shape is Preview first, then the Platform-specific prose, then install/code.
// Rationale: a reader lands here to see what the component looks like under our theme,
// not to read an install command they already know.
//
// Run `pnpm --filter @plainconceptsplatform/docs gen:components`. CI asserts that
// regenerating produces no diff, so a hand-edit to a generated page fails the build.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { COMPONENTS } from "./components-data.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const previewsDir = resolve(here, "../components/previews");
const outDir = resolve(here, "../content/docs/components");

function esc(value) {
  return value.replace(/"/g, '\\"');
}

/** Install + API blocks differ by where the component actually comes from. */
function provenance(slug, meta) {
  const shadcnDocs = `https://ui.shadcn.com/docs/components/${slug}`;

  if (meta.source === "package") {
    return {
      install: [
        "```bash",
        "pnpm add @plainconceptsplatform/ui-components",
        "```",
        "",
        `Import from the sub-path: \`@plainconceptsplatform/ui-components/${slug}\`.`,
      ].join("\n"),
      api: "[`packages/ui-components` README](https://github.com/PlainConceptsPlatform/Foundations/blob/main/packages/ui-components/README.md)",
    };
  }

  if (meta.source === "recipe") {
    return {
      install: `${meta.composedFrom}\n\nThere is no \`shadcn add ${slug}\`: it is a pattern you assemble, not a registry item.`,
      api: `[ui.shadcn.com/docs/components/${slug}](${shadcnDocs})`,
    };
  }

  if (meta.source === "none") {
    return {
      install: null,
      api: `[ui.shadcn.com/docs/${slug}](https://ui.shadcn.com/docs/${slug})`,
    };
  }

  return {
    install: ["```bash", `npx shadcn@latest add ${slug}`, "```"].join("\n"),
    api: `[ui.shadcn.com/docs/components/${slug}](${shadcnDocs})`,
  };
}

const slugs = Object.keys(COMPONENTS);
let written = 0;

for (const slug of slugs) {
  const meta = COMPONENTS[slug];
  if (meta.handwritten) continue;

  const source = readFileSync(resolve(previewsDir, `${slug}-demo.tsx`), "utf8").trimEnd();
  const { install, api } = provenance(slug, meta);

  const sections = [
    "---",
    `title: "${esc(meta.title)}"`,
    `description: "${esc(meta.description)}"`,
    "---",
    "",
    `import { ${meta.demo} } from "@/components/previews/${slug}-demo"`,
    "",
    `<ComponentPreview${meta.block ? " block" : ""}>`,
    `  <${meta.demo} />`,
    "</ComponentPreview>",
    "",
    "## When to use",
    "",
    meta.whenToUse,
    "",
    "## Platform notes",
    "",
    meta.platformNotes,
    "",
  ];

  if (install) sections.push("## Install", "", install, "");
  sections.push("## Code", "", "```tsx", source, "```", "", "## Full API", "", api, "");

  writeFileSync(resolve(outDir, `${slug}.mdx`), sections.join("\n"));
  written++;
}

writeFileSync(
  resolve(outDir, "meta.json"),
  `${JSON.stringify(
    {
      title: "Components",
      root: true,
      pages: [
        "---Platform---",
        "plain-logo",
        ...slugs.filter((slug) => COMPONENTS[slug].group === "platform"),
        "---shadcn/ui---",
        ...slugs.filter((slug) => COMPONENTS[slug].group !== "platform"),
      ],
    },
    null,
    2,
  )}\n`,
);

console.log(
  `[gen-component-pages] wrote ${written} pages (${slugs.length - written} handwritten, skipped)`,
);
