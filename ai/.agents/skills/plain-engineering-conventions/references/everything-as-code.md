# Everything as Code

Infrastructure, pipelines, configuration, and operational procedures — all version-controlled.

## Principle

**If it can be described as code, it must be code.** Manual provisioning, click-ops, and
undocumented runbooks are not acceptable. Every environment is reproducible from the repository.

## Infrastructure as Code (IaC)

### Rules

1. **Never provision infrastructure manually.** All cloud resources are defined in Terraform, Bicep,
   Pulumi, CDK, or equivalent.
2. **IaC lives in the repository** — typically in an `infra/` directory at the root (or a
   tool-specific name: `terraform/`, `bicep/`, `cdk/`).
3. **State is managed remotely.** Terraform state in a backend (Azure Storage, S3, GCS), never
   committed to the repository.
4. **Plan before apply.** Every change is reviewed as a plan/diff before execution — either in a PR
   or in a pipeline stage.

### Common Tools

| Tool | Ecosystem |
|------|-----------|
| Terraform | Multi-cloud, vendor-neutral |
| Bicep | Azure-native |
| Pulumi | Multi-cloud, general-purpose programming languages |
| AWS CDK | AWS-native |
| Crossplane | Kubernetes-native |

## CI/CD Pipelines as Code

### Rules

1. **Pipelines are YAML files in the repository.** No UI-only pipeline definitions — they must be
   version-controlled and reviewable.
2. **Pipelines are reproducible.** Running the same commit through the pipeline produces the same
   result (deterministic builds).
3. **Fail fast.** Cheap checks (lint, compile) run before expensive ones (integration tests,
   security scans, deployments).

### Recommended Pipeline Stages

```
┌──────────┐   ┌──────────┐   ┌────────────┐   ┌────────────┐   ┌──────────────┐
│   Lint   │──▸│  Build   │──▸│ Unit Tests │──▸│ Arch Tests │──▸│ Integration  │
│          │   │          │   │            │   │            │   │    Tests     │
└──────────┘   └──────────┘   └────────────┘   └────────────┘   └──────────────┘
                                                                       │
                                                                       ▼
┌──────────────┐   ┌────────────────┐   ┌──────────────┐   ┌──────────────────┐
│   Security   │──▸│   Deploy to    │──▸│  Smoke Test  │──▸│   Deploy to      │
│    Scan      │   │   Staging      │   │  (staging)   │   │   Production     │
└──────────────┘   └────────────────┘   └──────────────┘   └──────────────────┘
```

### Stage Responsibilities

| Stage | Purpose | Blocks on failure? |
|-------|---------|--------------------|
| **Lint** | Code style, formatting, static analysis | Yes |
| **Build** | Compile/transpile, resolve dependencies | Yes |
| **Unit Tests** | Fast domain logic tests (no I/O) | Yes |
| **Arch Tests** | Architecture rule enforcement | Yes |
| **Integration Tests** | Full-stack tests with real infrastructure | Yes |
| **Security Scan** | Dependency vulnerabilities, SAST, secrets detection | Yes (critical/high) |
| **Deploy to Staging** | Deploy to pre-production environment | Yes |
| **Smoke Test** | Verify critical paths work in staging | Yes |
| **Deploy to Production** | Release to production | — |

## GitOps

### Rules

1. **Infrastructure and application config live in the repo.** Environment-specific values are
   parameterized (variables, tfvars, Helm values), not hardcoded.
2. **The repo is the source of truth.** What is in `main` (or the deploy branch) is what runs in
   production.
3. **No manual changes to running environments.** All changes go through a PR, review, and pipeline.

## Environment Parity

Dev, staging, and production must differ **only by configuration** (connection strings, secrets, SKU
sizes), never by code or infrastructure shape.

| Property | Same across environments | Varies |
|----------|------------------------|--------|
| Code | Yes | — |
| Infrastructure shape | Yes | — |
| Resource instance sizes / tiers | — | Yes (smaller in dev) |
| Secrets values | — | Yes |
| Feature flags | — | Yes (optional) |

## Secrets Management

### Rules

1. **Never commit secrets to the repository.** No API keys, passwords, connection strings, or
   certificates in code or config files.
2. **Use a secrets manager.** Azure Key Vault, AWS Secrets Manager, HashiCorp Vault, GCP Secret
   Manager — or managed identity for password-less auth.
3. **Inject at runtime.** Secrets are injected as environment variables or mounted volumes at
   deployment time — never baked into container images.
4. **Rotate regularly.** Secrets have expiration dates. Automate rotation where possible.
5. **Scan for leaks.** Run secret detection tools (gitleaks, truffleHog, GitHub secret scanning) in
   CI.
