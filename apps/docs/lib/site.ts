/**
 * Single source of truth for site-level identity.
 *
 * Set NEXT_PUBLIC_SITE_URL in the deploy environment. It has no production
 * default on purpose: hardcoding the host here is how the deploy target drifted
 * out of sync with the docs in the first place.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const siteName = "Platform Foundations";

/** Kept in sync with content/docs/index.mdx frontmatter. */
export const siteDescription =
  "The shared theme, conventions, and showcase for PlainConcepts Platform apps.";

/**
 * The published theme version, generated from packages/theme/package.json.
 *
 * Surfaced in the nav because "is this alive, and what version am I on" is the
 * actual adoption question for a team deciding whether to depend on the theme,
 * and the site never answered it. Comes through the token generator rather than a
 * direct import: the theme package does not export its manifest, and adding that
 * export just to read a version would change a published package's contract.
 */
export { themeVersion } from "@/lib/tokens.generated";
