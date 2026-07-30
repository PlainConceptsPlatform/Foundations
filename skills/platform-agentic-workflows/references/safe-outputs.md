# Safe outputs

Verified against gh-aw **v0.83.4**.

Safe outputs are rung 6: the normal path for every **agent-directed** write. The agent runs
read-only and emits structured requests; a separate job validates and applies them with the
permissions it needs.

That separation is not ceremony. It gives an audit trail, bounds the damage when the agent is
wrong, sanitises anything the agent echoes from untrusted input, and means a prompt injection
cannot reach further than the types you declared.

**The rule: `permissions: read-all`, and every final agent decision writes through
`safe-outputs`.** Granting the agent `issues: write` so it can run `gh issue edit` throws all
of the above away. A deterministic custom job may make a minimal, idempotent pre-agent
lifecycle reservation (such as adding `bot-working`); it must not make judgement-based writes.

When that lifecycle write must be attributed to the Platform GitHub App rather than
`github-actions[bot]`, mint an installation token in the custom job and pass it only to the
local composite action:

```yaml
- uses: actions/create-github-app-token@v3.2.0
  id: app-token
  with:
    app-id: ${{ secrets.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
- uses: ./.github/actions/create-issue-comment
  with:
    token: ${{ steps.app-token.outputs.token }}
    issue-number: ${{ needs.pick.outputs.number }}
    body: |
      Automated work has started.
      [View this workflow run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})
```

Always include a run link and token usage in the deterministic completion comment in the
`conclude` job that depends on both `agent` and `safe_outputs`:

```yaml
conclude:
  needs: [pick, agent, safe_outputs]
  if: >
    needs.agent.result == 'success' &&
    needs.safe_outputs.result == 'success' &&
    needs.safe_outputs.outputs.process_safe_outputs_processed_count != '0'
```

```yaml
body: |
  ${{ env.MARKER }}
  ${{ env.FINISHED_COMMENT }}
  [View this workflow run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})
```

Never expose the app token to the agent job.

---

## The full surface

Default `max` in brackets.

### Issues

| Key | Max | Writes |
|---|---|---|
| `create-issue` | 1 | A new issue |
| `update-issue` | 1 | Title, body or state of an existing issue |
| `close-issue` | 1 | Closes with a reason |
| `link-sub-issue` | 1 | Parent/child relationship *(experimental)* |
| `set-issue-type` | 5 | The issue type field |
| `set-issue-field` | 5 | A custom field |
| `assign-milestone` | 1 | Milestone |
| `assign-to-user` | 1 | A human assignee |
| `unassign-from-user` | 1 | Removes an assignee |
| `assign-to-agent` | 1 | Assigns the Copilot coding agent |

### Pull requests

| Key | Max | Writes |
|---|---|---|
| `create-pull-request` | 1 | A PR from the agent's commits |
| `update-pull-request` | 1 | Title or body |
| `close-pull-request` | 10 | Closes without merging |
| `merge-pull-request` | 1 | Merges *(experimental)* |
| `push-to-pull-request-branch` | 1 | Commits onto an existing PR branch |
| `create-pull-request-review-comment` | 10 | Inline comment on a line |
| `reply-to-pull-request-review-comment` | 10 | Reply in a review thread |
| `submit-pull-request-review` | 1 | A consolidated review |
| `resolve-pull-request-review-thread` | 10 | Resolves a thread |
| `add-reviewer` | 3 | Requests a reviewer |

### Comments and labels

| Key | Max | Writes |
|---|---|---|
| `add-comment` | 1 | Comment on an issue, PR or discussion |
| `hide-comment` | 5 | Collapses a comment |
| `add-labels` | 3 | Adds labels |
| `remove-labels` | 3 | Removes labels |

### Discussions

`create-discussion` (1), `update-discussion` (1), `close-discussion` (1).

### Projects, releases, assets

`create-project`, `update-project` (10), `create-project-status-update`, `update-release`,
`upload-artifact`, `upload-asset` (10).

### Security and orchestration

| Key | Max | Writes |
|---|---|---|
| `create-code-scanning-alert` | unlimited | SARIF findings |
| `autofix-code-scanning-alert` | 10 | A suggested fix |
| `create-check-run` | 1 | A check on a PR |
| `dispatch-workflow` | 3 | Triggers another workflow (async) |
| `call-workflow` | 1 | Invokes a reusable workflow (sync, same run) |
| `dispatch-repository` | — | `repository_dispatch` to another repo |

### System types

`noop`, `missing-tool`, `missing-data` are enabled automatically. `noop` is how a run records
"I looked and there was correctly nothing to do", which is worth having: it distinguishes a
quiet run from a broken one.

---

## Configuring the ones we use

### `create-issue`

```yaml
safe-outputs:
  create-issue:
    max: 4
    deduplicate-by-title: 1       # true = exact, 0-100 = edit distance
    group: true                   # create as sub-issues of a parent
    close-older-issues: true
    expires: 7                    # auto-close after 7 days
```

`deduplicate-by-title` replaces "check for duplicates before proposing anything" — a rung-1
control instead of a rung-5 instruction. `group: true` with a `temporary_id` gives a parent
issue with children in one call:

```json
{"type": "create_issue", "temporary_id": "aw_abc", "title": "Audit report", "body": "…"}
{"type": "create_issue", "parent": "aw_abc", "title": "Finding 1", "body": "…"}
```

**Labels on created issues should be applied by a `conclude` job, not by the AI's
`create_issue` call.** The agent creates issues without labels; a post-agent deterministic
job reads `created_issue_number` from the `safe_outputs` job outputs and applies labels
via `gh issue edit`:

```yaml
jobs:
  conclude:
    needs: [agent, safe_outputs]
    if: >
      needs.agent.result == 'success' &&
      needs.safe_outputs.result == 'success' &&
      needs.safe_outputs.outputs.process_safe_outputs_processed_count != '0' &&
      needs.safe_outputs.outputs.created_issue_number != ''
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - uses: actions/checkout@v7
      - uses: actions/create-github-app-token@v3.2.0
        id: app-token
        with:
          app-id: ${{ secrets.BOT_APP_ID }}
          private-key: ${{ secrets.BOT_PRIVATE_KEY }}
      - name: Apply labels to created issues
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}
          REPO: ${{ github.repository }}
          ISSUE_NUMBERS: ${{ needs.safe_outputs.outputs.created_issue_number }}
        run: |
          set -euo pipefail
          numbers=(${ISSUE_NUMBERS//,/ })
          for n in "${numbers[@]}"; do
            gh issue edit "$n" --repo "$REPO" --add-label "bug,implement"
          done
```

`created_issue_number` is comma-separated when multiple issues were created. The conclude
job is the deterministic pattern for label application — it keeps labels out of the AI's
control and ensures they are always correct regardless of what the model decides.

### `add-comment`

```yaml
safe-outputs:
  add-comment:
    target: "*"                   # "triggering" | "*" | a number
    max: 3
    hide-older-comments: true
    footer: false
```

`target: "triggering"` is the default and requires a triggering issue or PR. Use `"*"` when
the workflow decides which item to comment on, which is the case for anything triggered by
`workflow_run` or a schedule.

### `add-labels` / `remove-labels`

```yaml
safe-outputs:
  add-labels:
    allowed: [bot-working, review]
  remove-labels:
    allowed: [implement, bot-working, review]
```

`allowed:` is the real control, and it is why this beats granting `issues: write`: the
workflow can touch exactly those labels and no others, whatever the prompt is persuaded to
attempt. Globs work (`team-*`, `area/*`), and `blocked:` is evaluated first.

`review` must be in **both** lists on any workflow that can stop for human input. If it is
missing from `remove-labels.allowed`, the bot silently fails to clear `review` on the next
successful cycle, and the issue looks like it still needs a human when it does not.

The emitted item schema is exact. Use `item_number` and `labels`:

```json
{"type":"add_labels","item_number":123,"labels":["review"]}
{"type":"remove_labels","item_number":123,"labels":["bot-working"]}
```

Do not invent `label_names`, `issue_number`, or a partial label payload. State this directly in
the prompt whenever labels are allowed; an incorrect Safe Outputs schema wastes a model run.

### Complete final payloads

Safe Outputs are terminal, not a conversational transport. Ask the agent to emit a complete
payload once its judgement is done. For example, an issue-refinement workflow that needs to ask
three questions emits **one** `add_comment` item containing the introduction and all questions,
not a progress comment and later follow-ups. This minimizes turns, prevents duplicate comments,
and makes the output job atomic from the user's point of view.

### `create-pull-request`

```yaml
safe-outputs:
  create-pull-request:
    draft: false
    if-no-changes: error
    labels: [automation]
    title-prefix: "[bot] "
```

Mechanics worth knowing:

- The agent commits to a branch in its workspace. The framework packages those commits as a
  git bundle, then a separate job applies and pushes it via GraphQL, so commits are **signed**
  and satisfy a signed-commit ruleset.
- Declaring `create-pull-request` automatically enables the git commands the agent needs
  (`checkout`, `branch`, `switch`, `add`, `rm`, `commit`, `merge`). You do not need a `bash:`
  allowlist for them, which is fortunate, because under opencode you would not get one.
- `draft: true` is policy, not a suggestion: the agent cannot override it.
- `if-no-changes:` is `warn` by default. Set it to `error` where producing nothing means the
  run failed, so a silent no-op does not read as success.
- Branch names get a random suffix unless `preserve-branch-name: true`.
- `protected-files:` defaults to `request_review`, which is why an agent touching
  `.github/workflows/` or a lockfile gets a `REQUEST_CHANGES` review rather than a clean PR.
  That default is correct; do not set it to `allowed` to make a run look tidier.

### `push-to-pull-request-branch`

```yaml
safe-outputs:
  push-to-pull-request-branch:
    target: "*"
    required-labels: [bot-working]

checkout:
  fetch: ["*"]
  fetch-depth: 0
```

**`target: "*"` requires the wildcard fetch.** Without it the branch is not in the shallow
clone and the push fails at the end of an otherwise successful run. The compiler warns:

```
⚠ push-to-pull-request-branch: target: "*" requires that all PR branches
  are fetched at checkout.
```

It also warns that `target: "*"` with no constraints lets the workflow push to any PR. Add
`required-labels:` or `required-title-prefix:` so it can only push to branches it is
supposed to own.

### `merge-pull-request`

Experimental, and the compiler says so on every compile. Merging is the highest-consequence
write available, so the prompt around it should be explicit that administrator merges and
bypassed checks are not permitted: if the merge is refused, the refusal is the answer.

### `threat-detection`

Enabled by default whenever safe outputs exist. It inspects agent output and the patch for
prompt injection, leaked secrets and malicious changes, and blocks the safe-output jobs if it
finds any.

```yaml
safe-outputs:
  threat-detection:
    runs-on: ubuntu-latest
```

**Platform: always pin `runs-on`.** Otherwise this job goes to a GitHub-hosted runner
independently of `runs-on-slim`. It has its own AI credit budget (default 400), separate from
the agent's.

Platform `agent-*.md` workflows set `threat-detection: false` explicitly in their own
frontmatter to avoid an additional model call. Retain the narrow Safe Outputs surface, read-only
agent permissions, network allowlist, and deterministic preconditions. Do not hide the setting
in a shared import: the workflow must make its own security/cost trade-off visible.

---

## Global options

```yaml
safe-outputs:
  staged: true                        # write nothing, preview everything
  github-token: ${{ secrets.X }}      # override the token
  environment: production             # gate writes behind an approval
  allowed-domains: [example.com]      # URL allowlist for sanitisation
  max-patch-size: 65536
  report-failure-as-issue: true
  concurrency-group: analysis
  messages:
    append-only-comments: true
```

`staged: true` is the first rung of a safe rollout: the run happens, the reasoning happens,
and the step summary shows what would have been written. It can also be set per type, so a
workflow can comment for real while its PR creation is still staged.

---

## Writing prompts for safe outputs

Use the language of proposal:

> Propose a pull request against `main` with the verified changes.
> Propose closing the issue, removing `implement`, and commenting `Auto-merged.`

Not "create a PR" or "run `gh issue close`". The agent has no such command, and asking for one
sends it hunting for a tool it does not have, which burns turns and ends in `missing-tool`.

Three more habits:

- **Declare only what the workflow needs.** Every extra type widens the blast radius. A
  workflow that comments does not need `update-issue`.
- **Say what not to write.** "Do not merge", "do not change any label other than
  `bot-working`", "do not close anything". The `allowed:` lists enforce it; the prompt stops
  the agent wasting turns trying.
- **Make the no-op explicit.** "If the audit found nothing actionable, say so and propose
  nothing." Without that, a model asked for four issues tends to find four issues.

---

## Custom safe outputs

`safe-outputs.jobs` turns an Actions job into a tool the agent can call. This is how a write
that gh-aw has no type for stays deterministic and keeps secrets away from the model.

```yaml
safe-outputs:
  jobs:
    notify-teams:
      description: "Post a message to the team channel"
      runs-on: ubuntu-latest
      output: "Message sent"
      inputs:
        message:
          description: "The message body"
          required: true
          type: string
      steps:
        - name: Post
          env:
            WEBHOOK: ${{ secrets.TEAMS_WEBHOOK }}
          run: |
            set -euo pipefail
            MSG=$(jq -r '.items[] | select(.type == "notify_teams") | .message' \
                    "$GH_AW_AGENT_OUTPUT")
            curl -sS -X POST "$WEBHOOK" -H 'Content-Type: application/json' \
              -d "$(jq -n --arg t "$MSG" '{text: $t}')"
```

Notes:

- Dashes normalise to underscores, so `notify-teams` is emitted as `notify_teams`.
- Input types are `string`, `boolean`, `choice`.
- `$GH_AW_AGENT_OUTPUT` is the JSON file holding the agent's emitted items.
- `needs:` orders the job against `agent`, `safe_outputs`, `detection`, or another custom job.
- Honour `GH_AW_SAFE_OUTPUTS_STAGED` so staged mode stays honest.
- Verified: the generated job is gated on
  `contains(needs.agent.outputs.output_types, 'notify_teams')`, so it only runs when the agent
  actually called it.
