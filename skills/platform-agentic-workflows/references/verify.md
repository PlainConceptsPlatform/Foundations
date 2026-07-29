# Compiling, probing, debugging

Verified against gh-aw **v0.83.4**.

---

## The loop

```bash
gh aw compile              # all workflows
gh aw compile my-workflow  # one
gh aw compile --watch      # recompile on save
```

Actions cannot read markdown. `gh aw compile` turns each `.md` into a `.lock.yml`, and that is
what GitHub runs. Both files must be siblings in `.github/workflows/`, and **the `.lock.yml` is
committed**.

Only frontmatter changes require recompilation. The markdown body is read at runtime, so a
prompt fix can be edited on github.com directly. That is a genuine convenience and also a trap:
a body edited on the web is not reflected in the `.lock.yml`'s hash, and `stale-check` may
notice.

```bash
gh aw validate             # validate without writing lock files
gh aw compile --strict --zizmor   # security scan, fails on findings
gh aw lint                 # actionlint over the generated YAML
gh aw fix --write          # apply codemods for deprecated fields
```

### Read the warnings

Zero errors is not the bar. The compiler's warnings are where the real problems live, because
every one of them describes something that will fail at runtime rather than at compile time.

Warnings seen on Platform workflows and what they mean:

| Warning | Meaning |
|---|---|
| `'tools' section ignored when using engine: opencode` | The whole block was dropped. Delete it |
| `workflow_run trigger should include branch restrictions` | It will fire for every branch. Add `branches: [main]` |
| `push-to-pull-request-branch: target: "*" requires ... wildcard fetch` | The push will fail at the end of a successful run. Add `checkout.fetch: ["*"]` |
| `target: "*" allows pushing to any PR branch` | Add `required-labels:` or `required-title-prefix:` |
| `Using experimental feature: merge-pull-request` | Expected. Note it and move on |
| `Using experimental OpenCode support` | Expected on every compile |
| `safe update mode detected unapproved changes` | A new secret or action appeared. Review it, then `--approve` |

### Safe update mode

When compilation introduces a new secret or action, gh-aw stops and asks for a security review
rather than silently widening the workflow's reach. Read what changed, satisfy yourself it is
not credential exfiltration or a supply-chain swap, then:

```bash
gh aw compile --approve
```

and record the new secret in the pull request description. Do not reach for `--approve` as a
reflex; the whole value of the gate is that someone looked.

---

## Probing an unfamiliar field

The published docs run ahead of the installed compiler. `on.workflow_run.conclusion` is
documented and rejected by v0.83.4. Do not guess, and do not teach a field you have not seen
compile: probe it, which takes about three minutes.

1. Write `.github/workflows/zz-probe.md` with the smallest frontmatter that exercises the
   field, plus a two-line body.
2. `gh aw compile zz-probe`.
3. If it errors, the error names the valid fields. If it compiles, grep the `.lock.yml` to
   confirm the field actually produced something — compiling is not the same as taking effect.
4. Delete both `zz-probe.md` and `zz-probe.lock.yml`.

Step 3 is the one that matters, and there are two ways a field can compile yet do nothing.

**It was dropped.** `tools: cache-memory:` compiles perfectly and produces nothing:

```bash
grep -c 'cache-memory' .github/workflows/zz-probe.lock.yml   # 0
```

**It was wired to a job that cannot see it.** `${{ needs.pre_activation.outputs.foo }}` in a
prompt compiles, and the compiler even generates an env var for it in the agent job — but the
agent job's `needs` does not include `pre_activation`, so the value is empty at runtime. Check
the graph, not just the presence of the reference:

```bash
awk '/^  agent:/{f=1} f&&/^    needs:/{g=1;next} g&&/^      - /{print $2; next} g{exit}' \
  .github/workflows/zz-probe.lock.yml
```

Whenever a probe answers "can the prompt read X", the answer is in that list.

Useful greps on a lock file:

```bash
grep -nE '^  [a-z_]+:$' x.lock.yml          # the job graph
grep -n 'needs.pre_activation.outputs' x.lock.yml
grep -n 'runs-on:' x.lock.yml               # every runner, incl. framework jobs
grep -n 'secrets\.' x.lock.yml              # every secret referenced
```

The expected job graph for a Platform workflow:

```
pre_activation   rung 2, if on.steps present
activation       roles, reactions, label removal
<custom jobs>    rung 4
agent            rung 3 steps + the model
detection        threat-detection
safe_outputs     rung 6
<custom safe jobs>
conclusion       reporting
```

If a job you expected is missing, the field that should have produced it was dropped.

---

## Testing the shell before a run

The rung-2/rung-4 scripts are where the real logic lives, and a failed workflow run is a slow,
expensive way to find a typo. All of them can be exercised locally.

### Extract what the compiler actually produced

Test the compiled script, not the markdown you think you wrote:

```bash
python - <<'PY'
import yaml
d = yaml.safe_load(open(".github/workflows/my-workflow.lock.yml"))
for name, job in d["jobs"].items():
    for i, s in enumerate(job.get("steps", [])):
        if "run" in s:
            open(f"./.tmp/{name}-{i}.sh", "w", newline="\n").write(s["run"])
PY
bash -n ./.tmp/*.sh          # syntax
```

On Windows, note that Python's `/tmp` and Git Bash's `/tmp` are different directories. Use a
relative path both agree on.

### Run it from a directory with no `.git`

A custom job is not checked out. Reproduce that, or `gh`'s repo inference will paper over a
missing `--repo` and the bug only appears in CI:

```bash
mkdir -p /tmp/nogit && cd /tmp/nogit
GH_TOKEN=$(gh auth token) REPO=owner/repo GITHUB_OUTPUT=/tmp/nogit/out bash /path/to/pick.sh
cat /tmp/nogit/out     # assert found=/number= are what you expect
```

Assert on `$GITHUB_OUTPUT`, not just the exit code. A script that exits 0 having written
`found=false` when there *is* work is a silent no-op.

### Shim `gh` to exercise branches you cannot reach

To test the paths that need data you do not have, or writes you must not perform, put a fake
`gh` earlier on `PATH` that returns synthetic data for the queries you want to control,
intercepts writes, and delegates everything else to the real binary. Real state lookups stay
real, so the test is honest about API shapes.

```bash
REALGH=$(command -v gh); mkdir -p ./.tmp/bin
cat > ./.tmp/bin/gh <<SHIM
#!/usr/bin/env bash
REAL="$REALGH"
case "\$1 \$2" in
  "issue list")
    if printf '%s ' "\$@" | grep -q 'audit:report'; then
      echo '[{"number":900,"title":"A","body":"- #177\n- #178"}]'; exit 0
    fi
    exec "\$REAL" "\$@" ;;
  "issue comment"|"issue edit"|"issue close"|"pr comment")
    echo "    [WOULD] gh \$*" >&2; exit 0 ;;
esac
exec "\$REAL" "\$@"
SHIM
chmod +x ./.tmp/bin/gh
PATH="$PWD/.tmp/bin:$PATH" bash ./.tmp/audit-close.sh
```

One caveat learned the hard way: a lazy shim that ignores `--jq` will hand raw JSON to a
variable the real `gh` would have reduced to a number. If output looks structurally wrong,
suspect the shim before the script.

This is also how to check a destructive path safely — every write prints `[WOULD] …` instead of
happening.

## Running it

```bash
gh aw run my-workflow                 # dispatch now
gh aw run my-workflow --repeat 3
gh aw run my-workflow --push          # commit and push first
gh aw run my-workflow --dry-run
gh aw trial ./my-workflow.md --logical-repo owner/repo   # in a throwaway repo
```

`gh aw trial` runs the workflow against a temporary repository, which is the safest way to
exercise a write path for the first time.

### Rolling out safely

Four stages, in order. Skipping straight to the last is how a fleet gets a reputation.

1. **`safe-outputs.staged: true`.** The run happens, the reasoning happens, nothing is written.
   The step summary shows what would have been. This catches bad judgement.
2. **`gh aw trial`**, or `staged: false` in a throwaway repository. This catches a broken write
   path, which staged mode cannot see.
3. **Real events, narrow scope.** Add `stop-after: "+7d"` so the trial expires instead of being
   forgotten, and keep `status-comment: true` while you are watching.
4. **Production.** Remove `stop-after`, turn off `status-comment`, keep `threat-detection`.

---

## Debugging a run

```bash
gh aw logs my-workflow
gh aw logs -c 10 --start-date -1w
gh aw logs --format markdown            # cross-run report with anomalies
gh aw audit <run-id>                    # one run in detail
gh aw audit <id-a> <id-b>               # diff two runs
gh aw health                            # success rates, last 7 days
gh aw outcomes <run-id>                 # what the safe outputs actually achieved
```

`gh aw audit` shows the firewall verdict per domain, token usage, turn count, and the agent's
tool calls. It is the first thing to run when a workflow "did nothing".

### Symptoms

| Symptom | Look at |
|---|---|
| Workflow never fires | `workflow_run.workflows` versus the target's `name:`. Then rung-1 filters: `roles:`, `names:`, `skip-if-*` |
| Run skipped, not failed | A pre-activation step exited non-zero, or a gate output was false. That is the designed behaviour for "no work" |
| Prompt says `issue #` with no number | A `needs.pre_activation.outputs.*` reference. Move the producer to a custom job |
| `fatal: not a git repository` in a custom job | A `gh issue`/`pr`/`run` call without `--repo`. Custom jobs are not checked out |
| A `gh api` state comparison never matches | `gh api` returns lowercase (`open`), `gh issue view` returns uppercase (`OPEN`) |
| A bot's PR is treated as a human's | A `*[bot]` login match. `gh pr list` reports an App as `app/name`; use `.author.is_bot` |
| Agent stalls, then times out | `network.allowed` missing `forge.plainconcepts.com`. Confirm in `gh aw audit`'s firewall section |
| Agent hunts for a tool it lacks | The prompt asks it to *do* a write instead of *propose* one. Check `missing-tool` in the output |
| Safe output silently absent | `threat-detection` blocked it, or the type was never declared |
| Push fails after a good run | `push-to-pull-request-branch: target: "*"` without `checkout.fetch: ["*"]` |
| Cache or memory does nothing | `tools:` under opencode. It was dropped |
| PR opens with a REQUEST_CHANGES review | `protected-files` fired. That is correct; do not set it to `allowed` |
| Cost comment says nothing | The proxy log is absent under Forge. Expected; fall back to the run log |

### When the model did something odd

Read the prompt as the model received it. `gh aw audit` shows it, including the interpolated
values and any `{{#if}}` blocks resolved. Two recurring causes:

- **Documentation leaked into the prompt.** A `## Diagram` section without the exclusion line,
  or explanation that belonged in `description:`.
- **The model was asked to decide something it could not know.** "Stop if any open issue already
  carries `bot-working`" requires a query it may not have made. Push it to rung 2.

---

## Before deleting a workflow

A `.github/workflows/` directory grows and starts to look padded. Two things make a live
workflow look dead, so audit reachability before removing anything.

**A `workflow_call`-only workflow never appears in the Actions tab** as a runnable entry or a
standalone run. It looks abandoned and may be the deployment path. Find its callers:

```bash
grep -rn 'uses: \./\.github/workflows/' .github/workflows/*.yml
```

**A `workflow_run` consumer is referenced by workflow *name*, not filename**, so grepping for the
filename finds nothing. Compare against `name:` values:

```bash
grep -rn -A4 'workflow_run:' .github/workflows/*.yml .github/workflows/*.md
```

Dump every trigger at once to see what is genuinely unreachable:

```bash
for f in .github/workflows/*.yml; do
  printf '%-30s ' "$f"
  python -c "
import yaml
d = yaml.safe_load(open('$f'))
on = d.get(True, d.get('on'))
print(', '.join(on) if isinstance(on, dict) else on)"
done
```

A workflow with no trigger, no caller and no `workflow_run` consumer is dead. Anything else is
load-bearing.

Also: `.lock.yml` files are compiled artifacts, not workflows. They inflate the directory listing
and account for most of the perceived clutter. Handle that at the display layer rather than by
deleting things:

```gitattributes
.github/workflows/*.lock.yml linguist-generated=true merge=ours
```

```jsonc
// .vscode/settings.json — nest each lock under its markdown and open it read-only
"explorer.fileNesting.patterns": { "*.md": "${capture}.lock.yml" }
```

## Repository maintenance

`gh aw compile` generates `agentics-maintenance.yml`. Do not hand-edit it. It gives you a daily
job closing expired items, and a `workflow_dispatch` with operations worth knowing:

| Operation | Does |
|---|---|
| `create_labels` | Creates every label the workflows reference |
| `disable` / `enable` | Kill switch for the whole fleet |
| `activity_report` | 24-hour, weekly or monthly activity |
| `forecast` | Token-usage projection |
| `safe_outputs` | Replays safe outputs from a specific run |
| `clean_cache_memories` | Removes stale cache entries |

Configure its runner in `.github/workflows/aw.json`:

```json
{ "maintenance": { "runs_on": "ubuntu-latest" } }
```

`gh aw compile --dependabot` generates a `dependabot.yml`. Platform repositories do not use
Dependabot, so do not pass that flag.

---

## Keeping it honest in CI

A lock file that drifts from its source is a workflow nobody is running. Check it:

```bash
gh aw compile && git diff --exit-code -- .github/workflows/
```

One caveat: compilation is not fully reproducible. `gh aw compile` embeds model prices at
compile time in `GH_AW_INFO_MODEL_COSTS`, and those figures move — within a single CI run, one
workflow was compiled with an input cost of `1.2e-06` and another with `1.4e-06`. A drift check
therefore has to ignore that line:

```bash
diff -I 'GH_AW_INFO_MODEL_COSTS' expected.lock.yml actual.lock.yml
```

Everything else in the lock must match, and that is the part worth enforcing. Also worth
asserting in CI: that every `workflow_run.workflows` entry resolves to a real `name:`, since
that failure is otherwise silent.
