import { defineConfig, devices } from "@playwright/test";

/**
 * E2E for the docs site. Playwright was named as the mandated E2E tool in
 * ARCHITECTURE.md, frontend.mdx, the migration guide and a `test:e2e` script,
 * but no config or spec existed. This is the smallest suite that actually earns
 * the claim: the pages ship, the chrome works, and both colour schemes render.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // The first requests against a freshly started server are slow (the OG image is
  // rendered on demand), and the default 30s was enough to flake under parallel
  // workers even though every test passed in isolation.
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    // `start` serves the production build, which is what we actually deploy.
    command:
      "pnpm --filter @plainconceptsplatform/docs build && pnpm --filter @plainconceptsplatform/docs start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
