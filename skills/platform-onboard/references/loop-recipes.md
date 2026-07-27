# Loop Recipes

Loop-task recipe templates and GitHub label setup for Platform projects. These recipes automate the development workflow: picking issues, implementing them with opencode, verifying, and merging.

## GitHub labels

Create these labels before using any loop recipe. Run the setup script or create them manually.

### Label set

| Label | Color | Purpose |
|---|---|---|
| `code:pick` | `#fbca04` (yellow) | Issue ready for automated pickup |
| `code:doing` | `#1d76db` (blue) | Issue currently being worked on |
| `code:done` | `#0e8a16` (green) | Issue completed and merged |
| `code:review` | `#d93f0b` (orange) | Issue needs human review before merge |
| `audit:report` | `#5319e7` (purple) | Generated audit report issue |
| `audit:closed` | `#c5def5` (light blue) | Audit report closed after all issues resolved |
| `refine:pick` | `#fef2c0` (light yellow) | Issue needs refinement into a user story |
| `refine:doing` | `#bfd4f2` (light blue) | Refinement in progress |
| `refine:done` | `#bfdadc` (light green) | Refinement complete, no open questions |
| `refine:questions` | `#e99695` (salmon) | Refinement has questions for the product owner |

### Setup script

```bash
#!/usr/bin/env bash
# .loops/setup-labels.sh
set -euo pipefail

labels=(
  "code:pick:#fbca04"
  "code:doing:#1d76db"
  "code:done:#0e8a16"
  "code:review:#d93f0b"
  "audit:report:#5319e7"
  "audit:closed:#c5def5"
  "refine:pick:#fef2c0"
  "refine:doing:#bfd4f2"
  "refine:done:#bfdadc"
  "refine:questions:#e99695"
)

for label in "${labels[@]}"; do
  name="${label%%:*}"
  rest="${label#*:}"
  color="${rest##*:}"
  gh label create "$name" --color "$color" --force 2>/dev/null || true
done

echo "Labels created."
```

## Recipe: dev-loop.json

The primary development loop. Picks the oldest `code:pick` issue, implements it with opencode, verifies, commits, creates a PR, and auto-merges with `--admin`. On failure, resets the tree and returns the issue to `code:pick`.

Place at `.loops/recipes/dev-loop.json`:

```json
{
  "version": 2,
  "loops": [
    {
      "taskId": "dev-preflight",
      "intervalHuman": "20m",
      "description": "Main dev loop: preflight -> pick issue -> implement -> verify -> commit -> PR. Bug issues auto-approve and merge; everything else waits for human review."
    }
  ],
  "tasks": [
    {
      "id": "dev-preflight",
      "name": "Preflight: clean tree + sync main",
      "command": "sh",
      "commandArgs": [
        "-c",
        "test -z \"$(git status --porcelain)\" && git switch main && git fetch origin && git rebase origin/main"
      ],
      "onSuccessTaskId": "dev-pick",
      "onFailureTaskId": "dev-clean-dirty",
      "maxRuns": 5
    },
    {
      "id": "dev-clean-dirty",
      "name": "Recovery: dirty tree, reset and return to main",
      "command": "sh",
      "commandArgs": [
        "-c",
        "git reset --hard && git clean -fd && git switch main && git fetch origin && git rebase origin/main"
      ],
      "onSuccessTaskId": "dev-pick",
      "onFailureTaskId": null,
      "maxRuns": 1
    },
    {
      "id": "dev-pick",
      "name": "Select and reserve oldest code:pick issue",
      "command": "sh",
      "commandArgs": [
        "-c",
        "number=$(gh issue list --label \"code:pick\" --state open --limit 1000 --json number --jq \"sort_by(.number) | .[0].number\"); test -n \"$number\" || exit 75; body=$(gh issue view \"$number\" --json number,title,body --jq \"{number,title,body}\"); gh issue edit \"$number\" --add-label code:doing --remove-label code:pick >/dev/null; printf \"%s\\n\" \"$body\""
      ],
      "onSuccessTaskId": "dev-implement",
      "onFailureTaskId": "dev-nothing",
      "maxRuns": 5
    },
    {
      "id": "dev-implement",
      "name": "Implement: opencode run",
      "command": "opencode",
      "commandArgs": [
        "run",
        "--agent",
        "fullstack-engineer",
        "First, load all skills available for your current agent. Then complete all remaining work for this issue. Inspect the current repository state. If there is an unfinished OpenSpec change, partial implementation, or failing validation related to this issue, continue and finish that work. If no related work exists, execute /plan-goal to plan and implement the issue. Preserve correct existing work. Work on a feature branch. Never explore or read files outside the current repository root. Do not push or perform any GitHub actions. Never ask for confirmation. Archive the completed change and generate visual evidence. Issue title: {{title}} Issue body: {{body}} Issue id: {{number}}"
      ],
      "onSuccessTaskId": "dev-verify",
      "onFailureTaskId": "dev-fail",
      "maxRuns": 5
    },
    {
      "id": "dev-verify",
      "name": "Verify: openspec clean + typecheck + tests + build",
      "command": "sh",
      "commandArgs": [
        "-c",
        "openspec list --json | python3 -c \"import sys,json; data=json.load(sys.stdin); exit(0 if len(data.get('changes',[]))==0 else 1)\" && pnpm --filter @*/* exec tsc --noEmit && pnpm --filter @*/* run test && pnpm --filter @*/* run build"
      ],
      "onSuccessTaskId": "dev-commit",
      "onFailureTaskId": "dev-implement",
      "maxRuns": 5
    },
    {
      "id": "dev-commit",
      "name": "Stage and commit all changes",
      "command": "sh",
      "commandArgs": [
        "-c",
        "git add -A && git commit -m \"fix: resolve #{{number}} {{title}}\" || true"
      ],
      "onSuccessTaskId": "dev-pr",
      "onFailureTaskId": null,
      "maxRuns": 5
    },
    {
      "id": "dev-pr",
      "name": "Create PR and squash merge (auto-admin)",
      "command": "sh",
      "commandArgs": [
        "-c",
        "BRANCH=$(git branch --show-current) && git push -u origin \"$BRANCH\" >/dev/null && PR_URL=$(gh pr create --title \"Resolve #{{number}}: {{title}}\" --body \"Closes #{{number}}\" --label code:done) && gh pr merge \"$PR_URL\" --squash --delete-branch --admin && printf '{\"prUrl\":\"%s\"}\\n' \"$PR_URL\""
      ],
      "onSuccessTaskId": "dev-complete",
      "onFailureTaskId": "dev-fail-merge",
      "maxRuns": 5
    },
    {
      "id": "dev-complete",
      "name": "Complete: close issue and return to main",
      "command": "sh",
      "commandArgs": [
        "-c",
        "gh issue edit {{number}} --add-label code:done --remove-label code:doing --remove-label code:review && gh issue close {{number}} && git checkout -- . && git clean -fd && git switch main"
      ],
      "onSuccessTaskId": null,
      "onFailureTaskId": null,
      "maxRuns": 5
    },
    {
      "id": "dev-fail-merge",
      "name": "Recovery: retry merge, then leave for review",
      "command": "sh",
      "commandArgs": [
        "-c",
        "BRANCH=$(git branch --show-current 2>/dev/null); if [ -n \"$BRANCH\" ] && [ \"$BRANCH\" != \"main\" ]; then   PR_URL=$(gh pr list --head \"$BRANCH\" --state open --json url --jq \".[0].url\" 2>/dev/null);   if [ -n \"$PR_URL\" ]; then     gh pr merge \"$PR_URL\" --squash --delete-branch --admin && exit 0;   fi; fi; gh issue edit {{number}} --add-label code:review --remove-label code:doing && git checkout -- . && git clean -fd && git switch main"
      ],
      "onSuccessTaskId": null,
      "onFailureTaskId": null,
      "maxRuns": 5
    },
    {
      "id": "dev-fail",
      "name": "Recovery: reset hard + relabel issue back to pick",
      "command": "sh",
      "commandArgs": [
        "-c",
        "git reset --hard && git clean -fd && git switch main && gh issue edit {{number}} --add-label code:pick --remove-label code:doing"
      ],
      "onSuccessTaskId": null,
      "onFailureTaskId": null,
      "maxRuns": 5
    },
    {
      "id": "dev-nothing",
      "name": "No tasks to pick",
      "command": "echo",
      "commandArgs": [
        "Nothing to do, no issues with code:pick label"
      ],
      "silentChain": true,
      "onSuccessTaskId": null,
      "onFailureTaskId": null,
      "maxRuns": 5
    }
  ]
}
```

Adapt the `dev-verify` task's filter pattern (`@*/*`) to match the project's npm workspace name. For a single-frontend project, use `@<org>/web`.

## Recipe: refine-loop.json

Picks the oldest `refine:pick` issue, rewrites it as a grounded user story using `/plan-story`, verifies the issue has a `refine:done` or `refine:questions` label, and returns to idle.

Place at `.loops/recipes/refine-loop.json`:

```json
{
  "version": 2,
  "loops": [
    {
      "taskId": "ref-pick",
      "intervalHuman": "20m",
      "description": "Refinement loop: pick issue, AI rewrite as user story, check answers, done"
    }
  ],
  "tasks": [
    {
      "id": "ref-pick",
      "name": "Select oldest refine:pick issue",
      "command": "sh",
      "commandArgs": [
        "-c",
        "number=$(gh issue list --label \"refine:pick\" --state open --limit 1000 --json number --jq 'sort_by(.number) | .[0].number'); test -n \"$number\" || exit 75; body=$(gh issue view \"$number\" --json number,title,body --jq '{number,title,body}'); gh issue edit \"$number\" --add-label refine:doing --remove-label refine:pick >/dev/null; printf \"%s\\n\" \"$body\""
      ],
      "onSuccessTaskId": "ref-refine",
      "onFailureTaskId": "ref-nothing",
      "maxRuns": 5
    },
    {
      "id": "ref-refine",
      "name": "AI: /plan-story to rewrite issue as grounded user story",
      "command": "opencode",
      "commandArgs": [
        "run",
        "--agent",
        "fullstack-engineer",
        "First, load all skills available for your current agent. Then execute /plan-story for GitHub issue {{number}}. The feature to capture is: {{title}}. Context from the issue body: {{body}}. You must update the GitHub issue body yourself with the resulting user story (Mike Cohn As a/I want to/so that format, Gherkin Given/When/Then acceptance criteria, edge cases, and Mermaid diagram if appropriate). Ground the story in the actual codebase by reading relevant files. Never explore or read files outside the current repository root. Run @humanizer on the final prose to remove AI writing patterns. At the end, if you have clarifying questions for the product owner, append them to the issue body and add the label 'refine:questions'. If the story is complete with no open questions, add label 'refine:done'. In either case, remove the 'refine:doing' label. Keep the final body as valid Markdown. Don't ask me anything during the session."
      ],
      "onSuccessTaskId": "ref-verify",
      "onFailureTaskId": "ref-fail",
      "maxRuns": 5
    },
    {
      "id": "ref-verify",
      "name": "Verify: issue has refine:done or refine:questions label",
      "command": "sh",
      "commandArgs": [
        "-c",
        "labels=$(gh issue view {{number}} --json labels --jq '.labels[].name'); echo \"$labels\" | grep -qE 'refine:(questions|done)' && git checkout -- . && git clean -fd && exit 0 || exit 1"
      ],
      "onSuccessTaskId": null,
      "onFailureTaskId": "ref-refine",
      "maxRuns": 5
    },
    {
      "id": "ref-fail",
      "name": "Recovery: relabel issue back to refine:pick",
      "command": "sh",
      "commandArgs": [
        "-c",
        "gh issue edit {{number}} --add-label refine:pick --remove-label refine:doing"
      ],
      "onSuccessTaskId": null,
      "onFailureTaskId": null,
      "maxRuns": 5
    },
    {
      "id": "ref-nothing",
      "name": "No issues to refine",
      "command": "echo",
      "commandArgs": [
        "Nothing to refine, no issues with refine:pick label"
      ],
      "silentChain": true,
      "onSuccessTaskId": null,
      "onFailureTaskId": null,
      "maxRuns": 5
    }
  ]
}
```

## Recipe: audit-cleanup-loop.json

Daily loop that checks `audit:report` issues and closes them when all referenced issues are resolved.

Place at `.loops/recipes/audit-cleanup-loop.json`:

```json
{
  "version": 2,
  "loops": [
    {
      "taskId": "cleanup-preflight",
      "intervalHuman": "1d",
      "description": "Audit cleanup loop: checks audit:report issues and closes them when all referenced issues are resolved"
    }
  ],
  "tasks": [
    {
      "id": "cleanup-preflight",
      "name": "Preflight: clean tree + sync main",
      "command": "sh",
      "commandArgs": [
        "-c",
        "test -z \"$(git status --porcelain)\" && git switch main && git fetch origin && git rebase origin/main"
      ],
      "onSuccessTaskId": "cleanup-select",
      "onFailureTaskId": null,
      "maxRuns": 5
    },
    {
      "id": "cleanup-select",
      "name": "Select oldest open audit:report issue",
      "command": "sh",
      "commandArgs": [
        "-c",
        "number=$(gh issue list --label \"audit:report\" --state open --limit 1000 --json number --jq 'sort_by(.number) | .[0].number'); test -n \"$number\" || exit 75; body=$(gh issue view \"$number\" --json number,body --jq '{number,body}'); printf '%s\\n' \"$body\""
      ],
      "onSuccessTaskId": "cleanup-ai",
      "onFailureTaskId": "cleanup-nothing",
      "maxRuns": 5
    },
    {
      "id": "cleanup-ai",
      "name": "AI: check referenced issues and close report if all resolved",
      "command": "opencode",
      "commandArgs": [
        "run",
        "--agent",
        "fullstack-engineer",
        "First, load all skills available for your current agent. You are an audit report cleanup agent. You receive an audit report issue with number {{number}} and body {{body}}. The body references GitHub issues with #NNN format. For each referenced issue number, check if it is closed using gh issue view NUMBER --json state. If ALL referenced issues are closed, close the report issue with gh issue close {{number}} --reason completed and add the label audit:closed using gh issue edit {{number}} --add-label audit:closed. If any referenced issue is still open, do nothing. Never explore or read files outside the current repository root. Do not ask for confirmation."
      ],
      "onSuccessTaskId": null,
      "onFailureTaskId": null,
      "maxRuns": 5
    },
    {
      "id": "cleanup-nothing",
      "name": "No reports to close",
      "command": "echo",
      "commandArgs": [
        "Nothing to close - no open audit reports"
      ],
      "silentChain": true,
      "onSuccessTaskId": null,
      "onFailureTaskId": null,
      "maxRuns": 5
    }
  ]
}
```

## Running loops

Use the loop-task CLI to start a recipe:

```bash
loop-task run .loops/recipes/dev-loop.json
loop-task run .loops/recipes/refine-loop.json
loop-task run .loops/recipes/audit-cleanup-loop.json
```

Each recipe is self-contained. The dev-loop and refine-loop run on a 20-minute cadence. The audit-cleanup-loop runs daily. Adjust `intervalHuman` based on project needs.

The `dev-implement` task calls `opencode run` which invokes the fullstack-engineer agent with the Platform skills loaded. The agent handles the issue through the OpenSpec pipeline: `/plan-goal` creates a change, implements it, verifies it, archives it, and generates evidence.

The `dev-verify` task checks that no OpenSpec changes are left unarchived, then runs typecheck, tests, and build. Adapt the filter pattern and build commands to match the project's workspace structure.
