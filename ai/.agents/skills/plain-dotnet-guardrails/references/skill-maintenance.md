# Skill Maintenance Guide

How to update, extend, and test the Plain Concepts skill suite.

## Adding a New Token

1. **Update `token-reference.md` first** ÔÇö add the new token to the master table with its description, example, and which skills use it.
2. **Update all stub files** ÔÇö find every file in every affected skill's `templates/` folder that should use the new token; replace the hardcoded value with the `__NEW_TOKEN__` placeholder.
3. **Update SKILL.md instructions** for each affected skill ÔÇö add a step where the agent asks the user for the token value (if it requires user input).
4. **Test** ÔÇö invoke the skill in a clean directory; verify the token is replaced in all output files and no `__NEW_TOKEN__` pattern remains.

## Updating Package Versions

1. **Update `Directory.Packages.props` stub** in `plain-dotnet-shell/templates/` ÔÇö this is the single source of truth for all package versions.
2. **Do not update individual `.csproj` stubs** ÔÇö all stubs use `<PackageReference Include="PackageName" />` without a version; the version comes from `Directory.Packages.props` centrally.
3. **Verify** by invoking `plain-dotnet-shell` in a clean directory and running `dotnet build` ÔÇö confirm no version conflicts.

## Adding a New Reference Document to plain-dotnet-guardrails

1. **Create the `.md` file** in `plain-dotnet-guardrails/references/`.
2. **Add a link to it in `plain-dotnet-guardrails/SKILL.md`** ÔÇö add a row to the Reference Documents table.
3. **Reference it from any skill SKILL.md that needs it** ÔÇö add `Read [doc-name](./references/doc-name.md) from @skill:plain-dotnet-guardrails` at the relevant step.
4. **No re-publishing needed** ÔÇö Copilot reads the current file on each invocation.

## Updating SKILL.md Instructions

1. Edit the `SKILL.md` directly ÔÇö the file is the live instruction set.
2. No versioning or publishing step required ÔÇö Copilot reads the current file on each invocation.
3. If you add new required inputs (token values), update `token-reference.md` to document the new token.
4. If you change the scaffold structure, update `arch-rules.md` or `modular-monolith-guide.md` to reflect the change.

## Testing a Skill

**Manual test procedure:**

1. Create a fresh empty directory:
   ```bash
   mkdir ~/skill-test && cd ~/skill-test
   ```

2. Invoke the skill in Copilot.

3. After scaffolding, verify:
   ```bash
   dotnet build {ProjectName}.slnx         # Must exit 0 ÔÇö no errors
   dotnet test {ProjectName}.slnx          # Must exit 0 ÔÇö all tests pass
   ```

4. Inspect created file structure against the canonical structure documented in `modular-monolith-guide.md`.

5. Check for leftover tokens:
   ```bash
   grep -r "__[A-Z_]*__" src/ tests/
   ```
   This must return no results.

## Adding a New Skill

To add a new skill to the suite:

1. Create the skill folder: `.github/skills/{skill-name}/SKILL.md`.
2. Add the trigger phrase "Read @skill:plain-dotnet-guardrails before executing." at the top of the new SKILL.md.
3. Add the new skill to the `skill-invocation-order.md` reference table.
4. Update `copilot-instructions.md` to include the new skill name and trigger phrases.
5. If the skill introduces new tokens, follow the "Adding a New Token" procedure above.

## Syncing to projects-awesome-copilot

Skills are authored in `plain.template.withai/.github/skills/` and synced to `projects-awesome-copilot/.github/skills/` for publishing. Sync procedure (manual for now):

1. Copy the updated skill folder(s) to `projects-awesome-copilot/.github/skills/`.
2. Update the `plugin.json` in `projects-awesome-copilot` if a new skill was added.
3. Open a PR in `projects-awesome-copilot` for review before publishing.

## Troubleshooting

| Issue | Resolution |
|-------|-----------|
| Skill not activating in Copilot | Check `description` field ÔÇö must be Ôëñ 1024 characters and contain the exact trigger phrase |
| Token not substituted | Verify the token is in `token-reference.md` and in the stub file content/name |
| `dotnet build` fails after scaffolding | Run skill again in a clean directory; if it fails consistently, check for missing project references in `.csproj` stubs |
| Module not discovered at startup | Verify `{ProjectName}.Server.csproj` has a `<ProjectReference>` to the module project |
| EF migrations fail | Verify `DesignTimeDbContextFactory` uses a valid local connection string |
