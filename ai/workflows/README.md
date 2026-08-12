# Workflow templates

Production [GitHub Agentic Workflows](https://github.github.io/gh-aw/) you can copy into a
repository. These are the files Platform runs, with the parts that only mean something inside
one repository removed.

The shape is **one router that owns every trigger, and workers that have none**.

| File | What it is |
|---|---|
| `work-router.yml` | Conventional YAML. Owns every trigger, classifies each event into exactly one route |
| `refine.md` | Worker. Rewrites an issue as a user story, or asks the author questions |
| `implement.md` | Worker. Implements, verifies, opens a pull request |
| `shared/platform-defaults.md` | Imported, never compiled. `network.allowed` and threat-detection policy |
| `shared/opencode-ci.md` | Imported, never compiled. Pinned toolchain setup and the `opencode.ci.json` merge |
| `opencode.ci.json` | Read at runtime. Declares the CI agent, its provider, and read permissions |
| `actions/*` | 23 composite actions and one shared helper, covering routing, context, output and maintenance |

Reusable workflow skills and copyable loops are in
[`PlainConceptsPlatform/Agentic-Workflows`](https://github.com/PlainConceptsPlatform/Agentic-Workflows).
Use its self-contained `workflow-author` and `workflow-consumer` skills.

## Why a router

A worker here exposes `workflow_call` and nothing else. Every trigger the repository has lives
in `work-router.yml`, which classifies the event and calls at most one thing.

Without it, every workflow subscribed to `issues: [labeled]` starts a run on every label, each
spinning up its own selection job before deciding it had nothing to do. With it, one event
produces one run, concurrency has a single owner, and the route table is a shell function a
test can execute directly.

It does **not** reduce the number of runs. GitHub creates a run for every matching event; the
router only decides that nothing downstream happens. Those runs take about ten seconds with
every job skipped.

## Installing

```bash
mkdir -p .github/workflows/shared .github/actions
cp work-router.yml .github/workflows/
cp refine.md implement.md .github/workflows/
cp shared/*.md .github/workflows/shared/
cp -r actions/* .github/actions/
cp opencode.ci.json .
gh aw compile --strict
```

`gh aw compile` writes a `.lock.yml` next to each `.md`, and **that** is what Actions runs.
Commit it. The markdown alone does nothing.

`work-router.yml` ships with the `refine` and `implement` routes live and the other three
(`apply-review`, `merge-gate`, `audit`) commented out, because only two workers are included
here. The classifier still selects those routes, and the route matrix will tell you they have
no job, which is the intended nudge when you add the workers.

## Before the first run

1. **`OPENAI_API_KEY`**, the Forge key. Map it through root `secrets:`; `engine.env` is
   rejected by strict compilation. `OPENAI_BASE_URL` is what sends traffic to Forge.

2. **`BOT_APP_ID` and `BOT_PRIVATE_KEY`** for the Platform GitHub App. Every `reserve` and
   `conclude` job mints a token from them so lifecycle writes are attributed to the App rather
   than `github-actions[bot]`.

3. **The labels**: `refine`, `refined`, `implement`, `bot-working`, `review`, `future`,
   `priority`, `bug`. Create them with
   `gh workflow run "Agentic Maintenance" -f operation=create_labels`.

4. **The opencode skills** the prompts load, from
   [opencode-onboard](https://github.com/PlainConceptsPlatform/opencode-onboard). Without them
   the agent still runs and does markedly worse work.

## What will bite

**The router's calling jobs need `permissions: write-all`.** Every agent job compiles to
`permissions: read-all`, which requests read on every scope, and a caller granting a tidier
explicit map cannot satisfy it. GitHub then rejects the call before creating any job: a
startup failure with zero jobs, no annotation and no log. The real boundary is the worker's own
`read-all` plus its safe-output allowlist, not the caller's grant.

**Do not use `secrets: inherit`.** It hands over every secret in the repository and SAST rules
block it. Name what the workers need, and check `gh secret list` first: passing a secret the
called workflow does not declare is also a startup failure.

**Set all three budgets.** `max-turns: 300`, `max-turn-cache-misses: 3000`,
`max-ai-credits: 5000`. Forge has no prompt cache, so every turn is a cache miss and a healthy
run dies at the compiler default of five.

**A job using a composite action needs `actions/checkout` first**, and a script must be invoked
as `bash path/to.sh`. A checkout from a Windows clone carries no executable bit, and the step
exits 126 before its first line.

**Never reference `needs`, `jobs` or `secrets` inside an `action.yml`**, not even in a
`description:`. The runner evaluates every `${{ }}` in a manifest and a composite action has
none of those contexts. `actions/verify-composite-actions` checks this, because nothing else
does: `gh aw compile` does not read those files and actionlint does not lint them.

## Verifying

```bash
gh aw compile --strict
bash .github/actions/verify-route-matrix/verify-route-matrix.sh
bash .github/actions/verify-composite-actions/verify-composite-actions.sh
actionlint $(git ls-files '.github/workflows/*.yml' | grep -v '\.lock\.yml$')
```

None of that can see a startup failure, a guard job that gates nothing, or an artifact name
that stopped resolving. **Watch one real event end to end before calling it done.** The router
ships a `validate` dispatch operation that runs the checks on a runner, which at least proves
the workflow loads and the composite actions resolve.

## What is deliberately not here

The merge gate, applying review feedback, and the scheduled audit. Two workers show the
pattern and five are a dump. Their routes are present in the router as commented contracts.
