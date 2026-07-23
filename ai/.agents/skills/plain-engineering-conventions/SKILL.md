---
name: plain-engineering-conventions
description: >
  Plain Concepts language-agnostic engineering conventions. Company-wide architectural
  principles, patterns, and quality standards that apply regardless of the technology stack.
  Use when the user asks about: engineering conventions, architecture principles, company
  standards, modular architecture, error handling patterns, observability rules, or CI/CD
  standards.
  Triggered by: "engineering conventions", "Plain standards", "architecture principles",
  "company conventions", "engineering principles", "Plain engineering", "quality standards".
metadata:
  plugin: pc-companion
  author: "Andoni Santamaria"
---

## Plain Concepts Engineering Conventions

Company-wide engineering principles that apply to every project regardless of language or framework.
This is a **reference-only skill** — it does not scaffold or generate any code.

### Stack-Specific Guardrails

For language-specific implementation details, read the corresponding guardrails skill:

| Stack | Skill | Purpose |
|-------|-------|---------|
| .NET | `@skill:plain-dotnet-guardrails` | .NET Modular Monolith implementation: Roslyn analyzers, Scrutor DI, Aspire conventions, EF Core patterns |

## Core Principles

| # | Principle | One-liner |
|---|-----------|-----------|
| 1 | **Repository Structure** | Standard folder layout, mandatory docs, and root config files |
| 2 | **Result-Oriented Errors** | Domain errors as values (not exceptions) + RFC 7807 |
| 3 | **Explicit Boundaries** | Public interfaces between components; no coupling to internal implementations |
| 4 | **Observability by Default** | Structured logging, distributed tracing, metrics |
| 5 | **Convention over Configuration** | Auto-discovery of handlers, validators, and modules |
| 6 | **Architecture as Code** | Enforce rules via tests and linters, not just docs |
| 7 | **Everything as Code** | IaC, CI/CD pipelines, GitOps — nothing manual |
| 8 | **Code Quality & Linting** | Automated formatting and static analysis enforced in CI — not negotiable |
| 9 | **Security by Default** | Vulnerability scanning, dependency auditing, and secret detection automated in CI |
| 10 | **Testing Strategy** | Deliberate test pyramid: unit, functional/integration, and E2E tests — all automated in CI |

## Reference Documents

| Document | Topic |
|----------|-------|
| [repository-structure.md](./references/repository-structure.md) | Folder layout, README, CONTRIBUTING, ADRs, AI tooling files |
| [error-handling.md](./references/error-handling.md) | Result pattern, error factories, RFC 7807 ProblemDetails |
| [explicit-boundaries.md](./references/explicit-boundaries.md) | Public APIs, no internal coupling, dependency direction, cross-boundary types |
| [observability.md](./references/observability.md) | Structured logging, OpenTelemetry, what never to log |
| [dependency-injection.md](./references/dependency-injection.md) | Convention-based DI, pipeline decorators |
| [architecture-enforcement.md](./references/architecture-enforcement.md) | Architecture tests, linter rules, CI gates |
| [everything-as-code.md](./references/everything-as-code.md) | IaC, CI/CD, GitOps, secrets management |
| [linting.md](./references/linting.md) | Formatter, linter, CI gate, suppression rules, tooling by stack |
| [security.md](./references/security.md) | Dependency scanning, SAST, secret detection, OWASP Top 10, LLM security, Zero Trust |
| [testing.md](./references/testing.md) | Test pyramid, unit tests, functional/integration tests, E2E with Playwright, BDD/Gherkin |
