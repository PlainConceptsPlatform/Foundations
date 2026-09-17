# Contributing

The foundation stays small on purpose. It owns the **theme, conventions, docs, and showcase**, and almost nothing else. That restraint is what makes it adoptable, so most good contributions here are subtractions, corrections, or a documented convention rather than new shared code.

## Local setup

Node 20 or 22 (see [`.nvmrc`](.nvmrc)) and pnpm.

```bash
pnpm install
pnpm dev          # docs + showcase at http://localhost:3000
```

The everyday checks, all of which CI also runs:

```bash
pnpm lint         # Biome (check + format)
pnpm lint:fix     # Biome, writing fixes
pnpm typecheck    # tsc across every workspace
pnpm build        # every workspace, including the docs site
```

## The bar for shared code

A component or utility only belongs here once the **same real requirement has appeared in multiple apps**. Until then it lives in the app that needs it. When something does cross that bar it is promoted deliberately and reviewed, not added speculatively.

Explicitly out of scope: custom business components, auth/API/state abstractions, observability or feature-flag packages, routing or app-shell wrappers, a custom CLI, and project generators.

Prefer a **documented convention** over new shared code whenever it will do the job.

## What is generated, and what you edit

Several things in this repo are generated. Editing the output instead of the input is the most common mistake, and CI fails the build when the two disagree.

| You want to change | Edit | Then run |
|---|---|---|
| A design token | `packages/theme/src/theme.css` | `pnpm --filter @plainconceptsplatform/docs gen:tokens` |
| A component page's prose | `apps/docs/scripts/components-data.mjs` | `pnpm --filter @plainconceptsplatform/docs gen:components` |
| Architecture, design or agent docs | `ai/ARCHITECTURE.md`, `ai/DESIGN.md`, `ai/AGENTS.md` | `pnpm dev` (predev syncs them) |

Do not hand-edit `apps/docs/content/docs/components/*.mdx`, `apps/docs/content/docs/reference/*`, or `apps/docs/lib/tokens.generated.ts`. Run `pnpm --filter @plainconceptsplatform/docs gen` and commit the result.

`ARCHITECTURE.md` and `DESIGN.md` follow the Platform Harness skills. Regenerate them rather than rewriting large sections by hand.

### Adding a component to the catalog

1. Add `apps/docs/components/previews/<slug>-demo.tsx`.
2. Add an entry to `COMPONENTS` in `apps/docs/scripts/components-data.mjs`, including `whenToUse` and `platformNotes`. Write only what is true for **Platform apps specifically**; the page already links to ui.shadcn.com for the API. A thin honest page beats a padded one.
3. Run `pnpm --filter @plainconceptsplatform/docs gen:components` and commit the generated page.

## Changing the theme

Edit tokens in `packages/theme/src/theme.css`, the single source of truth. Add a changeset, and apps pick the change up when they bump the dependency. Never fork the theme in an app.

Two rules the theme enforces rather than documents, so do not fight them:

- **No shadows.** The whole Tailwind shadow scale is overridden to a transparent value. `shadow-*` classes on vendored shadcn components compile and paint nothing, which is why upstream component source can be copied in unmodified. Elevation is `border` plus `bg-card`.
- **Reduced motion** is honoured globally in `base.css`. Do not re-implement it per component.

## Releasing

Both packages publish publicly to npm. Releases go through [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset          # describe the change and pick a bump
```

Commit the generated file with your PR. On merge to `main`, the release workflow opens a "Version Packages" PR; merging **that** publishes to npm with provenance. Do not run `pnpm publish` by hand.

Pick the bump honestly: a token value change is a **minor** because it changes how every consuming app looks, even though nothing breaks at the type level. Removing or renaming a token is a **major**.

## Writing Markdown

Prose is not hard-wrapped. Keep each paragraph on one physical line and let your editor soft-wrap it.

These files are read mostly by agents, and wrapping makes `\n` ambiguous: it could mean a new idea or just a column limit. One paragraph per line keeps newlines meaningful, which matters once Markdown passes through chunkers, embeddings, diffs, or agents doing line-based edits.

`markdownlint-cli2` enforces exactly one rule, `no-hard-wrapped-prose`, defined in `.markdownlint-rules.cjs`. Every built-in rule is off (`"default": false`) so a markdownlint release that adds a rule can never turn the build red. `MD013` stays off in particular: it enforces the opposite of this convention.

Run `pnpm lint:md`, or `pnpm lint:md:fix`. `lint-staged` runs it on staged `*.md` at commit time and CI runs it as part of `pnpm lint`. Other Platform repositories use the same rule and the same script name, so keep them aligned rather than renaming here.

Docs-site `*.mdx` is not linted yet; the reason is in `.markdownlint-cli2.jsonc`.

## Pull requests

- Keep it small and reversible. Explain the rationale, not just the diff.
- Screenshots for anything visible, in **both** light and dark.
- Conventional commit subjects (`feat:`, `fix:`, `docs:`, `chore:`, `build:`). Squash-merge subjects need to stay parseable.
- Required checks: lint, typecheck, build on Node 20 and 22.
- If you change a convention other teams follow, update the docs in the same PR.

## Reporting problems

Use the [issue templates](.github/ISSUE_TEMPLATE). For anything security related, follow [SECURITY.md](.github/SECURITY.md) and do not open a public issue.
