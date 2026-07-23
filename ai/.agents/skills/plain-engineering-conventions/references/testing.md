# Testing Strategy

Every project must have a deliberate testing strategy with automated tests at multiple levels.

## Principle

**Tests are not optional and not an afterthought.** A feature is not done until it has tests.
A bug fix is not done until there is a test that would have caught it.

The goal is not coverage percentage — it is confidence. Tests must cover the paths that matter:
business logic, error cases, integration points, and user journeys.

---

## The Test Pyramid

```
         /\
        /  \
       / E2E\          Few — slow, expensive, high confidence on journeys
      /------\
     /        \
    / Functional\      Some — medium speed, validate full use cases
   /  Integration\
  /--------------\
 /                \
/   Unit Tests     \   Many — fast, cheap, validate domain logic in isolation
/___________________\
```

- **Unit tests:** fast, no I/O, test domain logic in isolation. The bulk of the suite.
- **Functional / Integration tests:** test a full use case against real infrastructure (database, HTTP). Slower but higher confidence.
- **E2E tests:** test user journeys through the deployed application (browser or API). Few, targeted, run before release.

Inverting the pyramid (many E2E, few unit tests) is an anti-pattern — it produces a slow, brittle suite.

---

## Unit Tests

### What to test

- Domain logic, business rules, calculations
- Error cases and edge cases
- Pure functions and transformations

### What not to test

- Framework internals
- Trivial getters/setters with no logic
- Code that only orchestrates I/O (test that at the integration level)

### Rules

1. **No I/O in unit tests.** No database, no HTTP, no filesystem. Use fakes or in-memory implementations.
2. **One assertion per test** (or one behaviour). A test that asserts 10 things tells you nothing when it fails.
3. **Tests are independent.** No shared mutable state between tests. Any test can run in any order.
4. **Tests are deterministic.** The same test always produces the same result. No random data, no time-dependent logic without injection.
5. **Tests run fast.** A unit test suite should complete in seconds, not minutes.

### Naming convention

Test names describe behaviour, not implementation. Use a consistent pattern:

```
Should_<expected result>_When_<condition>
// or
<method>_<scenario>_<expected outcome>
// or (BDD style)
given_<context>_when_<action>_then_<outcome>
```

A failing test name should tell you exactly what broke without reading the code.

---

## Functional / Integration Tests

Test a complete use case end-to-end: HTTP request → handler → domain logic → persistence → response.

### Rules

1. **Use real infrastructure.** Use Testcontainers or equivalent to spin up a real database, message broker, or cache. In-memory fakes mask real problems.
2. **Test the full vertical slice.** From the entry point (HTTP, message, CLI command) to the persistence layer and back.
3. **Test the happy path and the main error paths.** Not every edge case — that is what unit tests are for.
4. **Clean state between tests.** Each test starts with a known, clean state. No test depends on a previous test's side effects.
5. **Run in CI on every PR.**

### Tooling by stack

| Stack | Tool |
|-------|------|
| JS / TS | Supertest, Testcontainers for Node |
| Python | pytest + Testcontainers |
| Go | testcontainers-go, `net/http/httptest` |
| Java | Spring Boot Test, Testcontainers |
| .NET | → see `plain-dotnet-guardrails` (FunctionalTests with Testcontainers) |

---

## E2E / Acceptance Tests

Test real user journeys through the deployed application — browser UI or full API flows.

### Rules

1. **Target journeys, not features.** E2E tests cover the critical paths a user actually takes, not every permutation.
2. **Run against a deployed environment.** E2E tests run against staging (or a dedicated test environment) — not against mocks.
3. **Keep the suite small and stable.** A flaky E2E suite is worse than no E2E suite. Prefer fewer, reliable tests.
4. **Run before every production release.** E2E tests are the final gate before deploying to production.
5. **Isolate test data.** Use dedicated test accounts and data that does not affect production or other test runs.

### Playwright (recommended for browser and API E2E)

Playwright is the recommended tool for E2E testing across all stacks. It supports browser automation
and API testing, runs cross-browser, and has first-class support for CI environments.
Playwright supports TypeScript, JavaScript, Python, Java, and .NET.

```
tests/
└── e2e/
    ├── playwright.config.*     # Config file (e.g. playwright.config.ts for TypeScript)
    ├── auth.spec.*             # Login, logout, session management
    ├── checkout.spec.*         # Critical purchase journey
    └── fixtures/               # Shared test setup and helpers
```

---

## BDD / Gherkin

Behaviour-Driven Development with Gherkin is **optional but recommended** for domains with
complex business rules or when tests serve as living documentation for non-technical stakeholders.

### When to use BDD

- Domain logic that is owned jointly by business and engineering
- Acceptance criteria that product/business needs to verify
- Regulatory or compliance requirements that need readable traceability

### When NOT to use BDD

- Simple CRUD endpoints with no business logic
- Technical infrastructure tests
- Projects where the only readers of tests are developers

### Structure

```gherkin
Feature: Order checkout

  Scenario: Successful checkout with valid payment
    Given a customer with items in their cart
    And a valid payment method on file
    When the customer confirms the order
    Then the order is created with status "confirmed"
    And the customer receives a confirmation email

  Scenario: Checkout fails when payment is declined
    Given a customer with items in their cart
    And a declined payment method
    When the customer confirms the order
    Then the order is not created
    And the customer sees a "payment declined" error
```

### Tooling by stack

| Stack | Tool |
|-------|------|
| JS / TS | Cucumber.js, Vitest with custom DSL |
| Python | Behave, pytest-bdd |
| Go | godog |
| Java / Kotlin | Cucumber-JVM |
| .NET | SpecFlow, Reqnroll |

---

## CI Integration

| Test type | When to run | Blocks pipeline? |
|-----------|-------------|-----------------|
| Unit tests | Every push, every PR | Yes |
| Integration / Functional tests | Every PR | Yes |
| E2E tests | Before release to production (staging) | Yes |
| BDD acceptance tests | Every PR (if present) | Yes |

---

## Coverage Policy

**Do not set a coverage percentage target as the primary quality metric.**

A 90% coverage number is meaningless if the 10% uncovered is the payment processing logic.
Coverage is a signal, not a goal.

### Rules

1. **Cover critical paths.** Business logic, error cases, and integration points must have tests.
2. **New code ships with tests.** A PR that adds a feature without tests is not ready to merge.
3. **Bug fixes ship with regression tests.** Every bug fix must include a test that would have caught the bug.
4. **Track coverage trends.** Coverage should not decrease over time without a conscious decision.

---

## What Does Not Belong Here

- **.NET-specific testing** (xUnit, Shouldly, ArchUnitNET, Testcontainers for .NET) → see `plain-dotnet-guardrails`
- **Performance / load testing** — out of scope for this reference
- **Chaos engineering** — out of scope for this reference
- **Security testing** (SAST, DAST) → see `security.md`
