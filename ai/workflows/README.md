# Workflow examples

Working [GitHub Agentic Workflows](https://github.github.io/gh-aw/) you can copy into a
repository. They are not illustrations: these are the files Platform runs in production, with
the parts that only mean something inside one repository removed.

| File | Fires when | Does |
|---|---|---|
| `refine.md` | `refine` label added, or the author replies | Rewrites the issue as a user story, or asks questions |
| `implement.md` | `implement` label added, or the merge gate finishes | Implements, verifies, opens a pull request |
| `shared/platform-defaults.md` | Imported, never compiled | `network.allowed`, and threat detection turned off with the reasoning |
| `shared/opencode-ci.md` | Imported, never compiled | Merges `opencode.ci.json` into `opencode.jsonc` before the agent starts |
| `opencode.ci.json` | Read at runtime | Declares the `plainconcepts` provider and the CI agent |

The full contract is the [`platform-agentic-workflows`](../../skills/platform-agentic-workflows)
skill, and the reasoning behind each choice is in
[the AI docs](https://foundations.plainconcepts.com/docs/ai/workflows).

## Installing

Copy the four files, keeping `shared/` a sibling of the workflow, and put `opencode.ci.json` at
the repository root:

```bash
mkdir -p .github/workflows/shared
cp refine.md implement.md .github/workflows/
cp shared/*.md .github/workflows/shared/
cp opencode.ci.json .
gh aw compile
```

`gh aw compile` writes a `.lock.yml` next to each `.md`, and **that** is what Actions runs. Commit
it. The markdown alone does nothing.

## Before the first run

Three things, none of them optional:

1. **A secret named `CODEX_API_KEY`** holding the Forge key. gh-aw's opencode engine looks for
   `CODEX_API_KEY` or `OPENAI_API_KEY` by fixed name and validates that one exists before the
   agent starts. The name is a variable name, not a destination: `OPENAI_BASE_URL` sends the
   traffic to `forge.plainconcepts.com`.
2. **The labels** the workflows read and write: `refine`, `refined`, `implement`, `bot-working`,
   `review`, `priority`, `bug`. `gh aw` can create them:
   `gh workflow run "Agentic Maintenance" -f operation=create_labels`.
3. **The opencode skills** the prompts load — `@ob-plan-story`, `@humanizer`, `/plan-goal`,
   `/repo-verify` — which come from
   [opencode-onboard](https://github.com/PlainConceptsPlatform/opencode-onboard). Without them
   the agent still runs and does markedly worse work.

## Two things that will bite

**The model name is three names.** `model: openai/glm-5-2` exists only to pass gh-aw's
validation, which rejects any provider outside a fixed list. `engine.args` asks for
`plainconcepts/glm-5-2`, a provider that `opencode.ci.json` defines pointing at gh-aw's own
firewall proxy, which forwards to `OPENAI_BASE_URL`. Nothing reaches OpenAI.

**`opencode.ci.json` hardcodes that proxy's address**, `http://172.30.0.30:10000`. It is gh-aw's
container network, not ours, so a gh-aw upgrade can move it. The failure looks like a model
timeout rather than a connection error, so check this file first when a version bump breaks
every workflow at once.

## What is deliberately not here

The other three workflows in the set — the merge gate, applying review feedback, and the
scheduled audit — because two examples show the pattern and five are a dump. The
[skill](../../skills/platform-agentic-workflows) describes all of them.
