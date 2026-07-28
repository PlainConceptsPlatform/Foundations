# Security

## Scope

This repository publishes two packages to npm:

- `@plainconceptsplatform/ui-theme` (CSS design tokens, no JavaScript)
- `@plainconceptsplatform/ui-components` (React components)

It also hosts the documentation site and the agent skills. Vulnerabilities in the published packages
are the highest priority here, because they reach every consuming Platform app on its next version
bump.

## Reporting a vulnerability

Do **not** open a public issue for a security problem.

Use GitHub's [private vulnerability reporting](https://github.com/PlainConceptsPlatform/Foundations/security/advisories/new)
on this repository. If you cannot use that, contact the Platform team directly through internal
channels.

Please include the affected package and version, what an attacker can do with it, and a reproduction
if you have one.

## What to expect

We will acknowledge the report and tell you whether we can reproduce it. If it is valid we will agree
a disclosure timeline with you, publish a patched version, and credit you unless you prefer
otherwise.

## Supported versions

Only the latest published minor of each package receives fixes. The foundation is consumed
internally and apps are expected to track current versions rather than pin old ones.

## Not a vulnerability

Reports we will close as out of scope: findings against the documentation site's content, results
from automated scanners with no demonstrated impact, and missing hardening headers on the docs site,
which serves public documentation and holds no user data.
