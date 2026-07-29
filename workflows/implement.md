---
description: |
  Implements an issue and opens a pull request. Stops there: the merge decision belongs to a
  separate gate workflow, which runs once CI has reported.

  Waiting on CI inside this run would hold a runner doing nothing, which is why the gate is
  a separate workflow rather than a later step.

name: "Agent: Implement Issue"

# Shared: the network and threat-detection contract, and the CI-only OpenCode provider.
# permissions, engine, model and runs-on cannot be shared — see shared/platform-defaults.md.
imports:
  - shared/platform-defaults.md
  - shared/opencode-ci.md

on:
  issues:
    types: [labeled]
    names: [implement]
  # Re-triggered when the gate finishes, so a queue of labelled issues drains without
  # polling. This is what replaces a fixed interval.
  #
  # workflow_run matches the workflow *name*, not the filename. Restrict to the default
  # branch or the trigger fires from every branch.
  workflow_run:
    workflows: ["Agent: Merge Gate"]
    types: [completed]
    branches: [main]
  workflow_dispatch:

  roles: [admin, maintainer, write]

  reaction: eyes

# Rung 4. A custom job rather than `on.steps`, because the prompt and the precompute step need
# the number. `on.steps` outputs land on the pre_activation job, which the agent job does not
# depend on, so they arrive as empty strings.
jobs:
  pick:
    # Duplicates `names: [implement]` above, and has to: GitHub has no native label
    # filter for `issues: [labeled]`, so a run is created for every label on any issue,
    # and `names:` only gates the activation job, which runs after this one. Without the
    # guard, adding an unrelated label starts a run whose `pick` job runs the cascade
    # before activation skips it. Mirrors gh-aw's own three-part condition.
    if: >
      github.event_name != 'issues' || github.event.action != 'labeled' ||
      github.event.label.name == 'implement'
    runs-on: ubuntu-latest
    permissions:
      issues: read
    outputs:
      found: ${{ steps.pick.outputs.found }}
      number: ${{ steps.pick.outputs.number }}
    steps:
      - name: Select the issue by the priority cascade
        id: pick
        env:
          GH_TOKEN: ${{ github.token }}
          REPO: ${{ github.repository }}
        run: |
          set -euo pipefail

          none() {
            echo "found=false" >> "$GITHUB_OUTPUT"
            echo "$1"
            exit 0
          }

          # `--repo` is not optional here. A custom job has no checkout, so `gh` cannot
          # infer the repository from a git remote and fails with
          # "fatal: not a git repository".

          # Refuse to start a second issue while one is in flight. On a workflow_run event
          # this is the whole gate: the gate finishing means the queue may have moved, not
          # that this run is entitled to a slot.
          busy=$(gh issue list --repo "$REPO" --label bot-working --state open --limit 1 \
                   --json number --jq 'length')
          [ "$busy" -eq 0 ] || none "an issue is already in flight"

          pick() {
            gh issue list --repo "$REPO" --label "$1" --state open --limit 1000 \
              --json number,labels \
              --jq '[.[] | select(any(.labels[].name; . == "bot-working") | not)]
                    | sort_by(.number) | .[0].number // empty'
          }

          number=$(pick "priority,bug,implement")
          [ -n "$number" ] || number=$(pick "priority,implement")
          [ -n "$number" ] || number=$(pick "bug,implement")
          [ -n "$number" ] || number=$(pick "implement")
          [ -n "$number" ] || none "nothing carries implement"

          {
            echo "found=true"
            echo "number=$number"
          } >> "$GITHUB_OUTPUT"
          echo "Selected #$number"

if: needs.pick.outputs.found == 'true'

runs-on: ubuntu-latest
runs-on-slim: ubuntu-latest

secrets:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

# `model` names provider `openai` because gh-aw validates against a fixed list and rejects
# anything else. The traffic goes to OPENAI_BASE_URL through gh-aw's own proxy, so nothing
# reaches OpenAI. Do not add `engine.args` with `--model`: the compiler drops it silently and
# the compiled lock is byte-identical without it.
engine:
  id: opencode
  version: "1.2.14"
  env:
    OPENAI_BASE_URL: https://forge.plainconcepts.com/v1

model: openai/glm-5-2

max-turns: 30
max-turn-cache-misses: 30

permissions: read-all

# Rung 3. The issue and its discussion are known before the model starts, so fetching
# them is not something to spend turns on.
steps:
  - name: Fetch the issue and its comments
    env:
      GH_TOKEN: ${{ github.token }}
      REPO: ${{ github.repository }}
      NUMBER: ${{ needs.pick.outputs.number }}
    run: |
      set -euo pipefail
      mkdir -p /tmp/gh-aw/agent
      gh api "repos/$REPO/issues/$NUMBER" \
        --jq '{number, title, body, labels: [.labels[].name]}' \
        > /tmp/gh-aw/agent/issue.json
      gh api "repos/$REPO/issues/$NUMBER/comments" --paginate \
        --jq '[.[] | {author: .user.login, body}]' \
        > /tmp/gh-aw/agent/issue-comments.json

safe-outputs:
  create-pull-request:
    draft: false
    title-prefix: "[bot] "
    if-no-changes: error
  add-comment:
    target: "*"
  add-labels:
    allowed: [bot-working, review]
    target: "*"
  remove-labels:
    allowed: [implement, bot-working]
    target: "*"

concurrency:
  group: implement
  cancel-in-progress: false

timeout-minutes: 90
---

1. You are implementing issue **#${{ needs.pick.outputs.number }}**. It was
   selected for you; do not choose a different one, and do not look for other candidates.

2. Read `/tmp/gh-aw/agent/issue.json` and `/tmp/gh-aw/agent/issue-comments.json`. The issue
   and its full discussion are already there.

3. Call `add_labels` to add `bot-working` so a human can see you hold this issue.

4. Load only skills required by the issue, then run `/plan-goal` for the issue and implement it.
   Implement only what the issue asks for: a vague sentence is not licence to redesign a
   module. Never read outside this repository root.

   If the issue is too unclear to implement, do not guess. Call `remove_labels` to remove
   `implement`, then `add_comment` saying precisely what is missing, and stop. A human re-adds
   `implement` when it is ready.

5. Run `/repo-verify`: lint, typecheck, tests, build. If it fails, fix the cause and run it
   again. Do not weaken a test, lower a threshold or skip a check to make it pass, and do not
   continue with a red verification.

6. Call `create_pull_request` against `main` with the verified changes. Its body must close the
   issue (`Closes #${{ needs.pick.outputs.number }}`) and summarise what changed
   and why. Do not merge it: the merge decision belongs to the gate, which sees the real CI
   result.

7. Call `add_comment` on the issue with the pull request number, then `remove_labels` to remove
   `bot-working` and leave `implement` in place. The gate removes `implement` once the pull
   request is merged, so a failure after this point leaves the issue visibly still wanting work.
   Stop immediately after the final Safe Outputs command succeeds.

8. On any failure: call `remove_labels` to remove both `implement` and `bot-working`, then
   `add_comment` with what failed and the verification output. A human re-adds `implement` to
   retry rather than the bot looping on a broken attempt.

9. If a required runtime dependency or tool prevents implementation, call `report_incomplete`
   with the blocking reason and stop. Call `noop` only when the picker found no eligible issue.

10. Ignore the `## Diagram` section below. It is documentation for humans and contains no
   instructions for you.

## Diagram

```mermaid
flowchart TD
    implStart("Trigger<br/>implement label, or the gate finished") --> implPick
    implPick["Pick (rung 4)<br/>In-flight check + priority cascade"] -->|picked| implFacts
    implPick -.->|busy, or nothing eligible| implIdle
    implFacts("Facts (rung 3)<br/>Issue and comments to disk") --> implReserve
    implReserve("Reserve<br/>Propose bot-working") -->|✓| implCode
    implCode["Implement<br/>/plan-goal, only what was asked"] -->|✓| implVerify
    implCode -.->|too unclear| implUnclear
    implVerify["Verify<br/>lint, typecheck, tests, build<br/>↻"] -->|✓| implPr
    implVerify -.->|✗| implCode
    implPr("PR<br/>Against main, Closes #N") -->|✓| implHandoff
    implPr -.->|✗| implFail
    implHandoff(("Handed off<br/>bot-working removed, gate decides"))
    implUnclear(("Unclear<br/>implement removed, detail requested"))
    implIdle(("Idle<br/>Busy, or nothing eligible"))
    implFail(("Fail<br/>Labels removed, output reported"))

    classDef start fill:#ffffff,stroke:#172033,stroke-width:2px,color:#172033
    classDef action fill:#eef0ff,stroke:#554cff,stroke-width:2px,color:#172033
    classDef decision fill:#fff8e8,stroke:#c75b00,stroke-width:2px,color:#172033
    classDef idle fill:#202c40,stroke:#738198,stroke-width:2px,color:#ffffff
    classDef failure fill:#fff0f0,stroke:#ef2929,stroke-width:2px,color:#8b1a1a
    classDef success fill:#e8f8ec,stroke:#18883c,stroke-width:2px,color:#145a32

    class implStart start
    class implFacts,implReserve,implPr action
    class implPick,implCode,implVerify decision
    class implIdle idle
    class implFail failure
    class implHandoff success
```
