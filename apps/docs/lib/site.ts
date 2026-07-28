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
