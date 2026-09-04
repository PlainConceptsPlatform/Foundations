# Agentic workflows

Workflow templates, the CLI, and the router live in
[`PlainConceptsPlatform/agentic-workflows`](https://github.com/PlainConceptsPlatform/agentic-workflows).

## What moved

The copyable templates that used to live here (router, workers, shared imports, composite actions,
the route matrix, the classifier) are now installed and maintained through the CLI in that repository.

## Install workflows in a repository

```bash
# Direct route only (minimal setup)
npx @plainconceptsplatform/workflows@latest add direct --force

# Interactive TUI for route/template selection
npx @plainconceptsplatform/workflows@latest

# Full fleet
npx @plainconceptsplatform/workflows@latest add refine implement direct apply-review merge-gate audit --force
```

The CLI installs into `.github/workflows/`, `.github/actions/`, and the repository root. It generates
the router, classifier, route matrix, and OpenCode CI config for the selected routes only.

## If the repository is not on GitHub

For a repository without GitHub Actions,
[`PlainConceptsPlatform/loop-task`](https://github.com/PlainConceptsPlatform/loop-task) runs the
same kind of agent work on a schedule from any machine.
