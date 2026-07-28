import { defineConfig } from "vitest/config";

/**
 * Two environments on purpose.
 *
 * The repo-wide drift guards in tests/ only read files, so they run in node.
 * Component tests need a DOM: before this config existed there was no jsdom at all,
 * which is why a hydration mismatch shipped in a published package without any test
 * noticing (the only React test used renderToStaticMarkup, so it never had a client
 * render to disagree with).
 */
export default defineConfig({
  test: {
    globals: false,
    environmentMatchGlobs: [
      ["packages/**/*.test.tsx", "jsdom"],
      ["packages/**/*.test.ts", "node"],
      ["tests/**", "node"],
    ],
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.ts", "packages/**/src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html"],
      // Only the code we publish. The docs app is covered by Playwright instead.
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "**/index.ts", "packages/*/src/**/logo-svgs.ts"],
    },
  },
});
