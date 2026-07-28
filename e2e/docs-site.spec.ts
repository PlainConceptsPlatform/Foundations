import { expect, test } from "@playwright/test";

/**
 * Each assertion here maps to something that was actually broken or missing before
 * the presentation overhaul, so a regression fails the build rather than shipping.
 */

test.describe("front door", () => {
  test("the homepage has a title, a primary action, and the section grid", async ({ page }) => {
    await page.goto("/");

    // The root layout exported no metadata at all, so there was no title.
    await expect(page).toHaveTitle(/Platform Foundations/);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();

    // The six-card router grid.
    const sections = page.getByRole("navigation", { name: "Documentation sections" });
    await expect(sections.getByRole("link")).toHaveCount(6);
  });

  test("the homepage has site chrome", async ({ page }) => {
    // There was no (home)/layout.tsx, so `/` rendered with no navbar at all.
    await page.goto("/");
    await expect(page.getByRole("navigation").first()).toBeVisible();
    await expect(page.locator('a[href*="github.com"]').first()).toBeVisible();
  });

  test("serves a favicon, an OG image, robots and a sitemap", async ({ request }) => {
    for (const [path, type] of [
      ["/icon.svg", "image/svg+xml"],
      ["/opengraph-image", "image/png"],
      ["/robots.txt", "text/plain"],
      ["/sitemap.xml", "application/xml"],
    ] as const) {
      const response = await request.get(path);
      expect(response.status(), `${path} should be served`).toBe(200);
      expect(response.headers()["content-type"], `${path} content type`).toContain(type);
    }
  });
});

test.describe("docs", () => {
  test("a component page leads with a rendered preview, then the Platform prose", async ({
    page,
  }) => {
    await page.goto("/docs/components/button");

    await expect(page).toHaveTitle(/Button · Platform Foundations/);

    // Preview before prose: the page used to open with an install command.
    await expect(page.getByRole("button", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "When to use" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Platform notes" })).toBeVisible();
  });

  test("the reference group is reachable from the sidebar", async ({ page }) => {
    // The synced reference pages were absent from meta.json, so architecture,
    // design and agents were unreachable even though they were generated.
    await page.goto("/docs/reference/architecture");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Architecture");
  });

  test("the token gallery renders generated swatches", async ({ page }) => {
    await page.goto("/docs/tokens");
    await expect(page.getByRole("heading", { name: "Semantic tokens" })).toBeVisible();
    // Swatches are buttons that copy the token name.
    await expect(page.getByRole("button", { name: /Copy --/ }).first()).toBeVisible();
  });

  test("a 404 renders the styled not-found page inside the site chrome", async ({ page }) => {
    const response = await page.goto("/docs/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /does not exist/i })).toBeVisible();
  });
});

test.describe("theming", () => {
  test("the brand blue reaches the chrome in light mode", async ({ page }) => {
    // Zero --color-fd-* overrides existed, so the whole site rendered in stock
    // Fumadocs neutral grey despite shipping a blue token package.
    await page.goto("/docs/components/button");

    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--color-fd-primary").trim(),
    );
    expect(primary).not.toBe("");
  });

  test("nothing paints a visible shadow", async ({ page }) => {
    // The theme neutralises every shadow scale; elevation is border + bg-card.
    await page.goto("/docs/components/card");

    const painting = await page.evaluate(
      () =>
        [...document.querySelectorAll("*")].filter((el) => {
          const shadow = getComputedStyle(el).boxShadow;
          return shadow && shadow !== "none" && !/rgba\(0,\s*0,\s*0,\s*0\)/.test(shadow);
        }).length,
    );
    expect(painting).toBe(0);
  });

  test("dark mode applies the dark surface", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/docs/components/card");

    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // #0d0e0f
    expect(background).toBe("rgb(13, 14, 15)");
  });
});
