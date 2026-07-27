# Loop Recipes

Use [the maintained Loop recipe guide](../../../apps/docs/content/docs/ai/recipes.mdx) as the source
of truth for recipe structure and production patterns. Recipes are YAML files in `.loops/recipes/`.
Each recipe includes a Mermaid `diagram` field that documents its task chain.

## Before adding recipes

1. Install the Loop-task skills so the agent understands the recipe schema:

   ```bash
   npx skills add plainconceptsplatform/loop-task
   ```

2. Create the GitHub labels used by the workflows.
3. Adapt verification, branch, and pull-request commands to the target repository. Do not copy a
   recipe that assumes a different package manager, workspace name, CI provider, or merge policy.

## Label conventions

| Workflow | Labels |
|---|---|
| Development | `code:pick`, `code:doing`, `code:done`, `code:review` |
| Refinement | `refine:pick`, `refine:doing`, `refine:questions`, `refine:answers`, `refine:redoing`, `refine:done` |
| Audit | `audit:report`, `audit:doing`, `audit:closed` |
| Routing | `priority`, `bug` |

Development, refinement, and re-refinement loops select the lowest-numbered issue from the first
non-empty priority tier: `priority` plus `bug`, `priority`, `bug`, then the workflow entry label.

## Recipe anatomy

```yaml
version: 2

loops:
  - taskId: <entry-task-id>
    intervalHuman: 20m
    description: What this loop does
    maxRuns: null

tasks:
  - id: <task-id>
    name: Human-readable name
    command: sh
    commandArgs: []
    onSuccessTaskId: <task-id>
    onFailureTaskId: <task-id>
    maxRuns: 5
    silentChain: false

diagram: |
  flowchart TD
    start --> verify
    verify -->|success| complete
    verify -.->|failure| fix
    fix --> verify
```

Task output is shared through `{{key}}` interpolation. Emit a JSON object on stdout to add named
values to the context; `{{output}}` contains the prior task's full stdout and stderr.

Use `exit 75` to route no-work conditions to a silent idle task, and set `maxRuns` on retrying
tasks. Keep destructive recovery commands out of reusable templates; target repositories must make
their own explicit recovery policy.

## Recommended loops

- **Dev loop:** pick work, implement it, verify it, open a pull request, and route failures or
  human decisions to `code:review`.
- **Refine and re-refine loops:** turn work items into grounded user stories and cycle through
  `refine:questions` and `refine:answers` until complete.
- **Audit loop:** run read-only checks, create actionable findings, and track their resolution with
  audit labels.

The full guide includes diagrams and production examples for each pattern.
