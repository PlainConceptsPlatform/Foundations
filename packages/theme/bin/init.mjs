#!/usr/bin/env node
import { existsSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");

const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function log(msg) {
  console.log(`${GREEN}[platform]${RESET} ${msg}`);
}

function warn(msg) {
  console.log(`${YELLOW}[platform]${RESET} ${msg}`);
}

const cwd = process.cwd();

const componentsJson = resolve(pkgRoot, "components.json");
const targetComponentsJson = resolve(cwd, "components.json");

if (existsSync(targetComponentsJson)) {
  warn("components.json already exists, skipping copy.");
} else {
  copyFileSync(componentsJson, targetComponentsJson);
  log("Copied components.json.");
}

const globalCssPath = resolve(cwd, "src/app/globals.css");
const globalAltPath = resolve(cwd, "src/app/global.css");
const targetCss = existsSync(globalCssPath) ? globalCssPath : globalAltPath;

if (existsSync(targetCss)) {
  const css = readFileSync(targetCss, "utf8");
  if (css.includes("@plainconceptsplatform/ui-theme")) {
    warn("Theme import already present in global stylesheet, skipping.");
  } else {
    writeFileSync(targetCss, `@import "@plainconceptsplatform/ui-theme";\n` + css, "utf8");
    log(`Added theme import to ${basename(targetCss)}.`);
  }
} else {
  warn("No src/app/globals.css or src/app/global.css found. Add this line to your global stylesheet:");
  console.log(`  ${CYAN}@import "@plainconceptsplatform/ui-theme";${RESET}`);
}

const layoutPath = resolve(cwd, "src/app/layout.tsx");
const layoutAltPath = resolve(cwd, "app/layout.tsx");
const layout = existsSync(layoutPath) ? layoutPath : layoutAltPath;

if (existsSync(layout)) {
  const content = readFileSync(layout, "utf8");
  if (content.includes("next/font/google") && content.includes("Outfit")) {
    warn("Outfit font already configured in layout, skipping.");
  } else {
    warn("Could not safely modify layout.tsx. Add the Outfit font manually:");
    console.log(`  ${CYAN}import { Outfit } from "next/font/google";
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
// Then add className={outfit.variable} to <html>${RESET}`);
  }
} else {
  warn("No layout.tsx found. Add the Outfit font manually:");
  console.log(`  ${CYAN}import { Outfit } from "next/font/google";
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
// Then add className={outfit.variable} to <html>${RESET}`);
}

log("Done! Now add components:");
console.log(`  ${CYAN}npx shadcn@latest add button card dialog ...${RESET}`);
