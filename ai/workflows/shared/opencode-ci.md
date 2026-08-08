---
description: |
  Prepares the runner for an agent run and merges the CI-only OpenCode provider from
  opencode.ci.json into opencode.jsonc. Imported by every agentic workflow, so the setup is
  defined once.

  Why the config merge exists at all: `opencode.jsonc` is a developer's local config and is not
  tracked, so it does not exist in a CI checkout. Without something like this, the only
  config the agent gets is the one gh-aw generates, which declares provider `awf-proxy` with
  model `claude-sonnet-4.5`, while `engine.args` asks for `awf-proxy/glm-5-2`.

  Why `pre-agent-steps:` and not `steps:`. Verified ordering inside the agent job:

      Checkout repository
      steps:                                          <- too early
      Checkout PR branch
      Restore agent config folders from base branch    <- reverts opencode.jsonc
      pre-agent-steps:                                 <- correct window
      Write OpenCode Config                            <- gh-aw merges its base on top
      Execute OpenCode CLI

  `steps:` runs before the base-branch restore, which lists `opencode.jsonc` in
  GH_AW_AGENT_FILES and would undo the merge on any pull-request event.

  Every version here is pinned. An agent run that installs a different toolchain than the one
  the last run used is not reproducible, and a failure caused by a floating dependency reads
  as a model failure.

env:
  OPENSPEC_VERSION: "1.8.0"
  AGENTMEMORY_VERSION: "0.9.28"
  CODEGRAPH_VERSION: "1.5.0"
  RTK_VERSION: "0.44.1"
  RTK_SHA256: "986f29704469b3d1051e2474105c6c75ab8b73651068dcd61612c1fb3938ad95"

pre-agent-steps:
  - name: Create agent scratch directory
    run: mkdir -p .opencode/.tmp

  - name: Install ripgrep
    run: |
      set -euo pipefail

      if ! command -v rg > /dev/null; then
        sudo apt-get update
        sudo apt-get install --yes ripgrep
      fi

      rg --version

  - name: Activate the pnpm version package.json pins
    run: |
      set -euo pipefail
      corepack enable
      corepack prepare --activate
      pnpm --version

  - name: Cache the pnpm store
    uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0
    with:
      path: ~/.local/share/pnpm/store
      key: pnpm-store-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
      restore-keys: pnpm-store-${{ runner.os }}-

  - name: Cache NuGet packages
    uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0
    with:
      path: ~/.nuget/packages
      key: nuget-${{ runner.os }}-${{ hashFiles('apps/api/**/*.csproj', 'apps/api/**/packages.lock.json') }}
      restore-keys: nuget-${{ runner.os }}-

  - name: Install OpenSpec CLI
    run: |
      set -euo pipefail
      npm install -g "@fission-ai/openspec@${OPENSPEC_VERSION}"
      openspec --version

  - name: Install RTK
    run: |
      set -euo pipefail

      tarball="$RUNNER_TEMP/rtk.tar.gz"
      curl -fsSL -o "$tarball" \
        "https://github.com/rtk-ai/rtk/releases/download/v${RTK_VERSION}/rtk-x86_64-unknown-linux-musl.tar.gz"
      echo "${RTK_SHA256}  $tarball" | sha256sum --check --strict

      tar -xzf "$tarball" -C "$RUNNER_TEMP"
      sudo install -m 0755 "$RUNNER_TEMP/rtk" /usr/local/bin/rtk

      rtk --version
      rtk init -g --opencode --auto-patch

  - name: Install agentmemory
    run: |
      set -euo pipefail
      npm install -g "@agentmemory/agentmemory@${AGENTMEMORY_VERSION}"
      agentmemory --version

  - name: Install codegraph and index the repository
    continue-on-error: true
    run: |
      set -euo pipefail
      npm install -g "@colbymchenry/codegraph@${CODEGRAPH_VERSION}"
      codegraph init

  - name: Install opencode plugin dependencies
    run: |
      set -euo pipefail

      if [ ! -f .opencode/package.json ]; then
        echo "No .opencode/package.json, nothing to install"
        exit 0
      fi

      npm install --prefix .opencode

  - name: Install workspace dependencies
    run: pnpm install --frozen-lockfile

  # Adjust or delete for the repository. A workflow whose agent never builds .NET does not
  # need this, and a solution at another path needs the path changed.
  - name: Restore .NET packages
    run: dotnet restore apps/api/<Solution>.slnx

  - name: Merge the CI-only OpenCode provider into opencode.jsonc
    run: |
      set -euo pipefail

      CONFIG=opencode.jsonc
      FRAGMENT=opencode.ci.json

      [ -f "$FRAGMENT" ] || { echo "::error::$FRAGMENT is missing from the checkout"; exit 1; }

      # Pure JSON on purpose, not JSONC: jq cannot parse `//` comments, and a naive
      # comment-stripper would corrupt the `http://` inside the provider's api URL.
      jq -e . "$FRAGMENT" > /dev/null \
        || { echo "::error::$FRAGMENT is not valid JSON. Comments are not allowed in it."; exit 1; }

      # opencode.jsonc is untracked, so it usually does not exist here. Create it from the
      # fragment when absent, merge when a checkout did provide one.
      if [ -f "$CONFIG" ]; then
        merged=$(jq -s '.[0] * .[1]' "$CONFIG" "$FRAGMENT")
      else
        merged=$(jq -S . "$FRAGMENT")
      fi
      printf '%s\n' "$merged" > "$CONFIG"

      # gh-aw's own "Write OpenCode Config" step runs next and merges its base config with
      # `$existing * $base`. Base wins on conflicting keys, but it defines neither `model`
      # nor this provider, so both survive and `awf-proxy` is added alongside.
      echo "Wrote $CONFIG from $FRAGMENT:"
      jq -r '"  model: \(.model // "unset")", "  plugins: \(.plugin // [] | join(", "))", "  providers: \(.provider // {} | keys | join(", "))"' "$CONFIG"
---
