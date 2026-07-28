import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const docs = defineDocs({
  dir: "content/docs",
});

/**
 * Turns ```mermaid fences into <Mermaid chart="..." />.
 *
 * The canonical docs in ai/ author diagrams as plain fences, and sync-docs emits
 * them as .md on purpose so arbitrary prose cannot break the strict MDX parser.
 * That meant every diagram in the Reference section rendered as a code block.
 *
 * Doing this as a remark plugin keeps both properties: the source stays plain
 * markdown that reads fine on GitHub, and the rendered page gets a real diagram.
 */
const remarkMermaid: Plugin<[], Root> = () => (tree) => {
  visit(tree, "code", (node, index, parent) => {
    if (node.lang !== "mermaid" || !parent || index === undefined) return;

    parent.children[index] = {
      type: "mdxJsxFlowElement",
      name: "Mermaid",
      attributes: [{ type: "mdxJsxAttribute", name: "chart", value: node.value }],
      children: [],
      // biome-ignore lint/suspicious/noExplicitAny: mdxJsxFlowElement is not part of the base mdast Root type
    } as any;
  });
};

export default defineConfig({
  mdxOptions: {
    remarkPlugins: (plugins) => [remarkMermaid, ...plugins],
  },
});
