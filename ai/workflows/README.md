# Workflow examples

Working [GitHub Agentic Workflows](https://github.github.io/gh-aw/) you can copy into a
repository. They are not illustrations: these are the files Platform runs in production, with
the parts that only mean something inside one repository removed.

| File | Fires when | Does |
|---|---|---|
| `refine.md` | `refine` label added, or the author replies | Rewrites the issue as a user story, or asks questions |
| `implement.md` | `implement` label added, or the merge gate finishes | Implements, verifies, opens a pull request |
| `shared/platform-defaults.md` | Imported, never compiled | `network.allowed`, and threat detection turned off with the reasoning |
| `opencode.ci.json` | Read at runtime | Declares the CI agent and repository read permissions |

The full contract is the [`platform-agentic-workflows`](../../skills/platform-agentic-workflows)
skill, and the reasoning behind each choice is in
[the AI docs](https://foundations.plainconcepts.com/docs/ai/workflows).

## Installing

Copy the three files, keeping `shared/` a sibling of the workflow, and put `opencode.ci.json` at
the repository root:

```bash
mkdir -p .github/workflows/shared
cp refine.md implement.md .github/workflows/
cp shared/platform-defaults.md .github/workflows/shared/
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
2. **The labels** the workflows read and write: `refine`, `refined`, `implement`, `bot-working`,
   `review`, `priority`, `bug`. `gh aw` can create them:
   `gh workflow run "Agentic Maintenance" -f operation=create_labels`.
3. **The opencode skills** the prompts load — `@ob-plan-story`, `@humanizer`, `/plan-goal`,
   `/repo-verify` — which come from
   [opencode-onboard](https://github.com/PlainConceptsPlatform/opencode-onboard). Without them
   the agent still runs and does markedly worse work.

## Two things that will bite

**Do not put `OPENAI_API_KEY` in `engine.env`.** Strict compilation rejects it. Map it through
root `secrets:` instead: `secrets: { OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} }`. The key
never reaches the agent's environment, and the workflow compiles clean.

**`max-turn-cache-misses` defaults to 5.** Forge caching can miss more than five consecutive
times on a healthy run. Without `max-turn-cache-misses: 30` set explicitly, an otherwise healthy
agent run fails at the compiler default. Always set both `max-turns: 30` and
`max-turn-cache-misses: 30`.

## What is deliberately not here

The other three workflows in the set — the merge gate, applying review feedback, and the
scheduled audit — because two examples show the pattern and five are a dump. The
[skill](../../skills/platform-agentic-workflows) describes all of them.
