// Sync the repo's canonical markdown into the docs site as a "Reference" group.
// Root files stay the single source of truth; these copies are generated and gitignored.
// Runs on predev / prebuild.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../.."); // apps/docs/scripts -> repo root
const outDir = resolve(here, "../content/docs/reference");

// source path (relative to repo root) -> page meta
const DOCS = [
  { src: "ai/ARCHITECTURE.md", slug: "architecture", title: "Architecture", description: "Reference architecture for Platform apps, frontend and backend." },
  { src: "ai/DESIGN.md", slug: "design", title: "Design guidelines", description: "Design principles and UI rules for the theme." },
  { src: "ai/AGENTS.md", slug: "agents", title: "AI agents", description: "Guidance and recommended skills for AI coding agents." },
];

// rewrite links between these docs to their in-site paths
const LINK_MAP = {
  "ARCHITECTURE.md": "/docs/reference/architecture",
  "STACK.md": "/docs/reference/architecture",
  "DESIGN.md": "/docs/reference/design",
  "AGENTS.md": "/docs/reference/agents",
  "PLAN.md": "/docs/reference/plan",
};

function transform(raw) {
  let body = raw;
  // strip an existing YAML frontmatter block (e.g. DESIGN.md token frontmatter).
  // Handle optional BOM and CRLF line endings.
  body = body.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  // strip the leading H1 (the page title comes from injected frontmatter)
  body = body.replace(/^\s*#\s+.*\r?\n/, "");
  // strip HTML comments (e.g. the "Last updated" footer); MDX forbids <!-- -->
  body = body.replace(/<!--[\s\S]*?-->/g, "");
  // rewrite cross-doc links to in-site paths
  for (const [base, url] of Object.entries(LINK_MAP)) {
    const re = new RegExp(`\\]\\([^)]*${base.replace(".", "\\.")}\\)`, "g");
    body = body.replace(re, `](${url})`);
  }
  // Note: files are emitted as .md (lenient markdown). Mermaid blocks stay as
  // code fences so arbitrary doc content (HTML comments, braces, angle brackets)
  // never breaks the strict MDX parser.
  return body.trimStart();
}

function esc(s) {
  return s.replace(/"/g, '\\"');
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const written = [];
for (const doc of DOCS) {
  const abs = resolve(repoRoot, doc.src);
  if (!existsSync(abs)) {
    console.warn(`[sync-docs] skipping missing source: ${doc.src}`);
    continue;
  }
  const body = transform(readFileSync(abs, "utf8"));
  const frontmatter = `---\ntitle: "${esc(doc.title)}"\ndescription: "${esc(doc.description)}"\n---\n\n`;
  writeFileSync(resolve(outDir, `${doc.slug}.md`), frontmatter + body + "\n");
  written.push(doc.slug);
}

writeFileSync(
  resolve(outDir, "meta.json"),
  `${JSON.stringify({ title: "Reference", pages: written }, null, 2)}\n`,
);

console.log(`[sync-docs] wrote ${DOCS.length} reference pages to content/docs/reference`);
