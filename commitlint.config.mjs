/**
 * Conventional commits, enforced on commit-msg.
 *
 * The repo already used this style and CONTRIBUTING requires it, but nothing checked
 * it. Squash-merge subjects need to stay parseable so release notes and changeset
 * bumps read correctly.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Longer than the default 100: the useful part of a subject here is often the
    // scope plus a specific noun, and truncating pushes detail into the body.
    "header-max-length": [2, "always", 110],
    "body-max-line-length": [1, "always", 100],
  },
};
