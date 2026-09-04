import { ComponentPreview } from "@/components/component-preview";
import { Mermaid } from "@/components/mermaid";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

/**
 * Registered globally so content can use the Fumadocs vocabulary without a per-page
 * import block. Before this, none of the 74 MDX files used any of it and the prose
 * rendered as an undifferentiated wall of paragraphs.
 *
 * `Accordions` is aliased away from the shadcn `Accordion` shown in the component
 * catalog: the catalog demos import that one explicitly, so the names must not clash.
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    Callout,
    ComponentPreview,
    File,
    Files,
    Folder,
    Mermaid,
    Step,
    Steps,
    Tab,
    Tabs,
    TypeTable,
    ...components,
  };
}
