# Security by Default

Vulnerability scanning, dependency auditing, and secret detection automated in CI — security is not an afterthought.

## Principle

**Security is a first-class engineering concern, not a final gate before release.** Every project
must have automated security checks running in CI from day one. A pipeline that does not scan for
vulnerabilities is incomplete.

Security findings are not optional: Critical and High severity issues block deployment.

---

## Dependency Vulnerability Scanning

Every project must audit its dependencies for known CVEs on every CI run.

### Audit commands by ecosystem

| Ecosystem | Indicator files | Command |
|-----------|----------------|---------|
| .NET | `*.csproj`, `*.sln`, `global.json` | `dotnet list package --vulnerable` |
| npm | `package.json` + `package-lock.json` | `npm audit --json` |
| Yarn | `package.json` + `yarn.lock` | `yarn audit --json` |
| pnpm | `package.json` + `pnpm-lock.yaml` | `pnpm audit --json` |
| Python | `requirements.txt`, `pyproject.toml`, `Pipfile` | `pip-audit --format=json` |
| Go | `go.mod` | `govulncheck ./...` |
| Java | `pom.xml`, `build.gradle` | OWASP Dependency-Check |
| Container | `Dockerfile` | `trivy image` or `grype` |

If multiple ecosystems are present (e.g. Python backend + npm frontend), run the scan for **each** one.

### Severity policy

| Severity | CI behaviour |
|----------|-------------|
| 🔴 Critical | Blocks pipeline — must be resolved before merge |
| 🟠 High | Blocks pipeline — must be resolved before merge |
| 🟡 Medium | Reported — tracked but not blocking |
| 🔵 Low | Reported — tracked but not blocking |

Critical and High vulnerabilities must be resolved or have a documented exception before deploying to production.

---

## Static Application Security Testing (SAST)

Run a SAST tool on every CI run. SAST catches insecure code patterns before they reach production.

### Tooling by stack

| Stack | Tool |
|-------|------|
| Any | Semgrep (language-agnostic, extensible rules) |
| Python | Bandit, Semgrep |
| Go | gosec, Semgrep |
| JS / TS | ESLint security plugins (`eslint-plugin-security`), Semgrep |
| Java / Kotlin | SpotBugs + Find Security Bugs, Semgrep |
| .NET / C# | → see `plain-dotnet-guardrails` (Roslyn security analyzers) |

SAST findings of Critical or High severity block the pipeline.

---

## Secret Detection

Secrets committed to a repository are compromised secrets — regardless of whether they are later removed.

### Rules

1. **Never commit secrets.** No API keys, passwords, tokens, connection strings, or certificates in code or config files.
2. **Commit `.env.example`, never `.env`.** Document required variables with placeholder values.
3. **Run secret scanning in CI.** Every push is scanned before merging.
4. **Run secret scanning as a pre-commit hook.** Catch leaks before they reach the remote.
5. **If a secret is committed, rotate it immediately.** Removing it from history is not enough — assume it is compromised.

### Recommended tools

| Tool | Use |
|------|-----|
| gitleaks | Pre-commit hook + CI scan |
| truffleHog | CI scan, deep history scan |
| GitHub Secret Scanning | Automatic on GitHub repositories |
| GitLab Secret Detection | Automatic on GitLab repositories |

---

## Container Security

If the project produces Docker images, scan them for known vulnerabilities before pushing to a registry.

### Rules

1. **Scan images in CI** before pushing to the registry.
2. **Use minimal base images.** Prefer `distroless` or `alpine` over `ubuntu` or `debian` full images.
3. **Do not run containers as root.** Use a non-root user in the `Dockerfile`.
4. **Pin base image versions.** Never use `:latest` — pin to a specific digest or tag.
5. **Do not bake secrets into images.** Use runtime injection (env vars, mounted secrets).

### Recommended tools

| Tool | Purpose |
|------|---------|
| Trivy | Image scanning (CVEs + misconfigurations) |
| Grype | Image and filesystem vulnerability scanning |
| Docker Scout | Integrated in Docker Hub |

---

## OWASP Top 10 — Awareness Checklist

Every code review of security-sensitive code should consider these risk categories.
This is a reference checklist — not a complete remediation guide.

| # | Risk | Key question |
|---|------|-------------|
| A01 | **Broken Access Control** | Does every endpoint verify the caller has permission for this specific resource? |
| A02 | **Cryptographic Failures** | Are passwords hashed with a modern algorithm (bcrypt, scrypt, Argon2)? Is data encrypted in transit and at rest? |
| A03 | **Injection** | Is all user input parameterized or validated before use in queries, commands, or templates? |
| A04 | **Insecure Design** | Are threat models considered at design time, not just implementation? |
| A05 | **Security Misconfiguration** | Are default credentials changed? Are unnecessary features disabled? Are error messages free of stack traces? |
| A06 | **Vulnerable and Outdated Components** | Are all dependencies up to date? Is there a process to track CVEs? |
| A07 | **Identification and Authentication Failures** | Is MFA available? Are sessions invalidated on logout? Are brute force attacks mitigated? |
| A08 | **Software and Data Integrity Failures** | Are dependencies verified (checksums, lock files)? Is the CI/CD pipeline protected from tampering? |
| A09 | **Security Logging and Monitoring Failures** | Are security-relevant events logged? Are failed auth attempts, access control failures, and anomalies alerted? |
| A10 | **Server-Side Request Forgery (SSRF)** | Is user-controlled input used in server-side HTTP requests? Are outbound requests allowlisted? |

---

## LLM / AI Security

Projects that integrate Large Language Models must additionally consider the OWASP LLM Top 10.

| Risk | Convention |
|------|------------|
| **LLM01 — Prompt Injection** | Never concatenate raw user input into prompts. Sanitize and constrain input. Use system prompts to define scope and restrict behaviour. |
| **LLM02 — Insecure Output Handling** | Treat LLM output as untrusted. Validate and sanitize before rendering, storing, or executing. |
| **LLM06 — Sensitive Information Disclosure** | Strip PII and confidential data from context before sending to an LLM. Filter sensitive patterns from responses before returning to users. |
| **LLM09 — Overreliance** | LLM output must not be the sole decision-maker for security-sensitive operations. Require human confirmation for high-impact actions. |

---

## Zero Trust

Internal services are not trusted by default. Every service-to-service call must be authenticated and authorized.

### Rules

1. **Authenticate every request** — including internal API calls between services.
2. **Authorize at the resource level** — verify the caller has permission for the specific resource, not just access to the service.
3. **Validate all input** — regardless of whether the caller is internal or external.
4. **Log all access** — authentication events, authorization failures, and anomalies.
5. **Assume breach** — design systems to limit blast radius if one component is compromised.

---

## Dependency Update Policy

Outdated dependencies are a primary source of CVEs. Keeping them current is non-negotiable.

### Rules

1. **Configure an automated dependency update bot** — Dependabot (GitHub) or Renovate.
2. **Review and merge dependency PRs weekly** — do not let them accumulate.
3. **No Critical CVE in production** — a deployment with an unresolved Critical CVE requires a documented exception approved by the team.
4. **Track EOL runtimes** — Node, Python, .NET, Java versions with no security support must be upgraded.

---

## SBOM (Software Bill of Materials)

Generate a Software Bill of Materials on every release. An SBOM provides a complete inventory of
all dependencies, enabling rapid response when a new CVE is disclosed.

| Tool | Ecosystem |
|------|-----------|
| `cyclonedx-npm` | Node / npm |
| `cyclonedx-python` | Python |
| `dotnet CycloneDX` | .NET |
| Syft | Any (container or filesystem) |
| trivy (with `--format cyclonedx`) | Container images |

Store the SBOM as a CI artifact alongside each release.

---

## What Does Not Belong Here

- **Penetration testing / DAST** — manual or automated attack simulation, out of scope for this reference
- **Compliance frameworks** (SOC2, ISO 27001, HIPAA) — organisation-level concerns
- **.NET-specific security rules** (Roslyn analyzers, ASP.NET middleware) → see `plain-dotnet-guardrails`
