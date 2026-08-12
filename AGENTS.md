# AGENTS.md

This repository keeps its AI guidance and recommendations in [`ai/`](ai/). That folder is the
project's documentation bundle and source of truth for conventions, architecture, design rules,
and agent definitions. Reusable migration skills live in [`skills/`](skills/).

Reusable GitHub Agentic Workflow skills and copyable loops have moved to
[`PlainConceptsPlatform/Agentic-Workflows`](https://github.com/PlainConceptsPlatform/Agentic-Workflows).
Use its self-contained `workflow-author` and `workflow-consumer` skills to create or adopt
workflows.

Do not create or use a root-level `.agents/` directory for this repository. The project does not
store runtime agent configuration or installed agent packages there.
