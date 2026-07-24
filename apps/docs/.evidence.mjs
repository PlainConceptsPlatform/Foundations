import { chromium } from "@playwright/test";

const ROOT = "http://localhost:3100";
const SHOTS = "/home/azureuser/projects/Platform-Foundations/apps/docs/.evidence";

const pages = [
  ["scroll-area", `${ROOT}/docs/components/scroll-area`],
  ["carousel", `${ROOT}/docs/components/carousel`],
  ["chart", `${ROOT}/docs/components/chart`],
  ["sidebar", `${ROOT}/docs/components/sidebar`],
  ["date-picker", `${ROOT}/docs/components/date-picker`],
  ["combobox", `${ROOT}/docs/components/combobox`],
  ["data-table", `${ROOT}/docs/components/data-table`],
  ["components-index", `${ROOT}/docs/components`],
];

const browser = await chromium.launch();
for (const [name, url] of pages) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
  console.log("shot", name);
  await page.close();
}
await browser.close();
console.log("done");
