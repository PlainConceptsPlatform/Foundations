# Workflow templates

Production-quality [GitHub Agentic Workflows](https://github.github.io/gh-aw/) you can copy
into a repository. These are the files Platform runs in production, with the parts that only
mean something inside one repository removed. They include the full lifecycle: issue-context
preload, GitHub App token attribution, conclude/incomplete terminal jobs, and reusable
composite actions.

| File | Fires when | Does |
|---|---|---|
| `refine.md` | `refine` label added, or the author replies | Rewrites the issue as a user story, or asks questions |
| `implement.md` | `implement` label added, or the merge gate finishes | Implements, verifies, opens a pull request |
| `shared/platform-defaults.md` | Imported, never compiled | `network.allowed`, and threat detection turned off with the reasoning |
| `shared/opencode-ci.md` | Imported, never compiled | Merges `opencode.ci.json` into `opencode.jsonc` before the agent starts; installs pnpm, RTK, agentmemory, codegraph |
| `opencode.ci.json` | Read at runtime | Declares the CI agent and repository read permissions |
| `actions/*` | Used by workflows | 20 reusable composite actions for the issue lifecycle |

The full contract is the [`platform-agentic-workflows`](../../skills/platform-agentic-workflows)
skill, and the reasoning behind each choice is in
[the AI docs](https://foundations.plainconcepts.com/docs/ai/workflows).

## Installing

Copy the workflows, shared components, composite actions, and CI config:

```bash
mkdir -p .github/workflows/shared .github/actions
cp refine.md implement.md .github/workflows/
cp shared/*.md .github/workflows/shared/
cp -r actions/* .github/actions/
cp opencode.ci.json .
gh aw compile
```

`gh aw compile` writes a `.lock.yml` next to each `.md`, and **that** is what Actions runs. Commit
it. The markdown alone does nothing.

## Before the first run

Three things, none of them optional:

1. **A secret named `OPENAI_API_KEY`** holding the Forge key. The workflow maps it through root
   `secrets:` — do not put it in `engine.env`, strict compilation rejects it. The name is a
   variable name, not a destination: `OPENAI_BASE_URL` sends the traffic to
   `forge.plainconcepts.com`.

2. **Secrets for the Platform GitHub App**: `BOT_APP_ID` (the app's client ID) and
   `BOT_PRIVATE_KEY` (the app's private key). These are used by every `reserve`, `conclude`,
   and `incomplete` job to attribute lifecycle writes (labels, comments) to the Platform bot
   rather than `github-actions[bot]`.

3. **The labels** the workflows read and write: `refine`, `refined`, `implement`, `bot-working`,
   `review`, `priority`, `bug`. `gh aw` can create them:
   `gh workflow run "Agentic Maintenance" -f operation=create_labels`.

4. **The opencode skills** the prompts load — `@ob-plan-story`, `@humanizer`, `/plan-goal`,
   `/repo-verify` — which come from
   [opencode-onboard](https://github.com/PlainConceptsPlatform/opencode-onboard). Without them
   the agent still runs and does markedly worse work.

## Two things that will bite

**Do not put `OPENAI_API_KEY` in `engine.env`.** Strict compilation rejects it. Map it through
root `secrets:` instead: `secrets: { OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} }`. The key
never reaches the agent's environment, and the workflow compiles clean.

**`max-turns: 300` and `max-turn-cache-misses: 100`.** Forge caching can miss more than five
consecutive times on a healthy run (every turn is a miss — Forge has no prompt cache). Without
`max-turns: 300` and `max-turn-cache-misses: 100` set explicitly, an otherwise healthy agent
run fails at the compiler default of 5.

## What is deliberately not here

The other three workflows in a full Platform fleet — the merge gate, applying review feedback,
and the scheduled audit — because two examples show the pattern and five are a dump. The
[skill](../../skills/platform-agentic-workflows) describes all of them, and
`references/determinism.md` includes the LifecycleOps pattern, the composite action taxonomy,
and the conversion-to-YAML test.
