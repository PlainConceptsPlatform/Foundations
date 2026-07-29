# Triggers and rung-1 filters

Verified against gh-aw **v0.83.4**.

The trigger is rung 0 and the filters are rung 1. Together they decide whether a run happens
at all, and they do it before a runner is claimed. Work spent here is free; the same decision
made in the prompt costs a model call and can be argued with.

---

## Choosing the trigger

| The work starts when | Trigger |
|---|---|
| A label is added | `issues: [labeled]` with `names:` |
| A label means "do this once, now" | `label_command:` |
| An issue is opened | `issues: [opened]` |
| Someone comments on an issue | `issue_comment: [created]` |
| Someone comments on a PR's code | `pull_request_review_comment: [created]` |
| Someone submits a review | `pull_request_review: [submitted]` |
| A PR opens or gets new commits | `pull_request: [opened, synchronize]` |
| A PR merges | `pull_request: [closed]` + `if:` on `merged` |
| A workflow finishes | `workflow_run: [completed]` |
| A human types a command | `slash_command:` |
| A human clicks a button | `workflow_dispatch:` |
| An external system says so | `repository_dispatch:` |
| A release is published | `release: [published]` |
| A deployment fails | `deployment_status:` with `state: [error, failure]` |
| Genuinely a clock | `schedule:` |

### `label_command` versus `issues: [labeled]`

Both react to a label. They mean different things.

```yaml
on:
  label_command: reaudit      # a command: fires, then removes the label
```

```yaml
on:
  issues:
    types: [labeled]
    names: [implement]        # a state: the label persists as metadata
```

Use `label_command` when the label is a button — applying it again should run it again. Use
`names:` filtering when the label describes the issue and other things read it. `implement`
is state, because the merge gate later removes it to mean "done". `reaudit` would be a
command.

The matched label is available as `${{ needs.activation.outputs.label_command }}`.

### `schedule`

Prefer fuzzy syntax over cron. The compiler scatters the exact minute so that many
repositories do not fire at once:

```yaml
on:
  schedule: daily
  schedule: daily around 14:00
  schedule: daily between 9:00 and 17:00
  schedule: weekly on friday around 5pm
  schedule: hourly
  schedule: daily on weekdays
```

Raw cron still works (`- cron: "17 1,13 * * *"`) and is right when the time genuinely matters.

Any scheduled workflow should carry `skip-if-no-match` so that a quiet day costs nothing.

### `workflow_run`

The chaining trigger, and the one with the sharpest edge: **`workflows:` matches the workflow
`name:`, not the filename.** A reference to `agent-merge-gate` when the workflow is named
`Agent: Merge Gate` silently never fires. Nothing errors; the workflow simply does not run.

```yaml
on:
  workflow_run:
    workflows: ["App: CI"]
    types: [completed]
    branches: [main]
```

`branches:` is not optional in practice — the compiler warns without it, because otherwise
the workflow fires for runs on every branch in the repository.

`conclusion:` is documented but **rejected in v0.83.4**. Filter in the frontmatter instead:

```yaml
if: github.event.workflow_run.conclusion == 'failure'
```

Or, when the workflow handles several conclusions differently, let it fire for all of them and
branch in the prompt on `${{ github.event.workflow_run.conclusion }}` — the value is known, so
this is reading a fact rather than making a judgement.

`workflow_run` is how you cross a wait without holding a runner. A workflow that opens a PR
should stop there; a second workflow triggered by CI's completion picks the thread back up.

### `slash_command`

```yaml
on:
  slash_command:
    name: review
    events: [pull_request_comment]
```

Defaults to the filename as the command name and to all events. Access defaults to users with
write permission.

---

## Rung-1 filters

All of these live under `on:` alongside the events.

### `names:` — label filtering

```yaml
on:
  issues:
    types: [labeled, unlabeled]
    names: [bug, critical, security]
```

Replaces "continue only if the label added was X". Also available on `pull_request`.

### `roles:` — who may trigger

```yaml
on:
  roles: [admin, maintainer, write]
```

Defaults to `[admin, maintainer, write]`. **Exact match, not a minimum**, so `roles: [write]`
rejects an admin. `roles: "all"` allows any authenticated user and should be treated as a
decision, not a convenience.

This is the correct place for an authorisation check. A prompt instruction saying "the comment
author must be a collaborator" is a security control implemented as a request to a model that
is reading the untrusted comment.

### `bots:` and `skip-bots:`

```yaml
on:
  bots: ["dependabot[bot]"]     # allow only these bots
  skip-bots: true               # ignore all bots
```

`skip-bots` replaces "and the comment was not written by you". A workflow is not triggered by
its own comment, but it can be triggered by another bot's.

### `skip-author-associations:`

```yaml
on:
  skip-author-associations:
    issue_comment: [first_time_contributor, none]
```

Finer than `roles:` when the distinction is contribution history rather than permission.

### `forks:`

```yaml
on:
  pull_request:
    types: [opened, synchronize]
    forks: ["trusted-org/*"]
```

`["owner/repo"]`, `["owner/*"]`, or `["*"]`. On a self-hosted runner this is the difference
between a fork PR running arbitrary code on your box and not.

### `skip-if-match:` and `skip-if-no-match:`

GitHub search queries evaluated before activation.

```yaml
on:
  schedule: daily
  skip-if-no-match:
    query: "is:issue is:open label:implement"
    min: 1
```

```yaml
on:
  schedule: daily
  skip-if-match: 'is:issue is:open in:title "[daily-report]"'
```

`max:` on `skip-if-match` and `min:` on `skip-if-no-match` set the threshold. Queries are
repo-scoped unless you set `scope: none`, which is how you search across an org.

This pair replaces a recipe's `exit 75` "nothing to do" task exactly, and it does it without
starting anything.

### `lock-for-agent:`

```yaml
on:
  issues:
    types: [opened, edited]
    lock-for-agent: true
```

Locks the issue while the agent works and unlocks it afterwards, so a human cannot edit under
the agent mid-run. Ignored for pull requests, which cannot be locked.

---

## Feedback and gating

### `reaction:`

```yaml
on:
  reaction: eyes
```

Adds a reaction to the triggering item so a human can see the workflow noticed. One of `+1`,
`-1`, `laugh`, `confused`, `heart`, `hooray`, `rocket`, `eyes`, or `none`.

### `status-comment:`

```yaml
on:
  status-comment: true
```

Posts a started/finished comment linking the run. Useful while a workflow is new; noisy once
it is trusted. `hide-older-comments:` on `add-comment` mitigates the noise.

### `manual-approval:`

```yaml
on:
  workflow_dispatch:
  manual-approval: production
```

Requires an environment approval before the run proceeds. The environment must exist with
reviewers configured.

### `stop-after:`

```yaml
on:
  schedule: daily
stop-after: "+7d"
```

Stops the workflow triggering after a deadline. The honest way to trial a scheduled workflow:
it expires rather than being forgotten.

---

## Custom filtering

When a filter needs more than the above, put it on rung 2 with `on.steps`
(`references/determinism.md`) or in a custom job:

```yaml
on:
  issues:
    types: [opened]

jobs:
  filter:
    runs-on: ubuntu-latest
    outputs:
      should-run: ${{ steps.check.outputs.result }}
    steps:
      - id: check
        env:
          LABELS: ${{ toJSON(github.event.issue.labels.*.name) }}
        run: |
          if echo "$LABELS" | grep -q '"bug"'; then
            echo "result=true" >> "$GITHUB_OUTPUT"
          else
            echo "result=false" >> "$GITHUB_OUTPUT"
          fi

if: needs.filter.outputs.should-run == 'true'
```

Prefer `on.steps` for this shape: it is one job cheaper and the failure semantics are cleaner,
because a failing pre-activation step skips the run rather than failing it.

---

## Safety notes

- Unsafe triggers (`push`, `issues`, `pull_request`, `issue_comment`) get permission checks
  by default. Do not disable them with `roles: "all"` without a reason you would defend.
- `pull_request_target` runs with the base repository's secrets against a fork's code. Avoid
  it. If it is unavoidable, PR-head checkout is disabled by default and should stay that way.
- Untrusted text belongs in `${{ steps.sanitized.outputs.text }}`, never the raw body.
- A workflow is not triggered by its own writes, so the obvious infinite loop is prevented.
  Two workflows triggering each other is not, and `concurrency` will not save you from it.
  Check the pair whenever you add a `workflow_run` edge.
