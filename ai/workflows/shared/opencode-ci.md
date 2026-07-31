---
description: |
  Merges the CI-only OpenCode provider from opencode.ci.json into opencode.jsonc before the
  agent starts. Imported by every agentic workflow, so the merge is defined once.

  Why this file exists at all: `opencode.jsonc` is a developer's local config and is not
  tracked, so it does not exist in a CI checkout. Without something like this, the only
  config the agent gets is the one gh-aw generates, which declares provider `awf-proxy` with
  model `claude-sonnet-4.5` — while `engine.args` asks for `awf-proxy/glm-5-2`.

  Why `pre-agent-steps:` and not `steps:`. Verified ordering inside the agent job:

      Checkout repository
      steps:                                          <- too early
      Checkout PR branch
      Restore agent config folders from base branch    <- reverts opencode.jsonc
      pre-agent-steps:                                 <- correct window
      Write OpenCode Config                           <- gh-aw merges its base on top
      Execute OpenCode CLI

  `steps:` runs before the base-branch restore, which lists `opencode.jsonc` in
  GH_AW_AGENT_FILES and would undo the merge on any pull-request event.

pre-agent-steps:
  - name: Create agent scratch directory
    run: mkdir -p .opencode/.tmp

  - name: Verify ripgrep is available to the agent runtime
    run: |
      set -euo pipefail

      if ! command -v rg > /dev/null; then
        sudo apt-get update
        sudo apt-get install --yes ripgrep
      fi

      rg --version

  - name: Install pnpm
    run: |
      set -euo pipefail
      npm install -g pnpm
      pnpm --version

  - name: Install OpenSpec CLI
    run: |
      set -euo pipefail
      npm install -g @fission-ai/openspec
      openspec --version

  - name: Install RTK (token optimization CLI proxy)
    run: |
      set -euo pipefail
      RTK_VERSION="0.44.1"
      curl -fsSL "https://github.com/rtk-ai/rtk/releases/download/v${RTK_VERSION}/rtk-x86_64-unknown-linux-musl.tar.gz" -o /tmp/rtk.tar.gz
      tar -xzf /tmp/rtk.tar.gz -C /tmp
      sudo mv /tmp/rtk /usr/local/bin/rtk
      chmod +x /usr/local/bin/rtk
      rtk --version
      rtk init -g --opencode --auto-patch || echo "RTK init skipped (non-fatal)"

  - name: Install agentmemory
    run: |
      set -euo pipefail
      npm install -g @agentmemory/agentmemory
      agentmemory --version || echo "agentmemory installed"

  - name: Install codegraph
    run: |
      set -euo pipefail
      npm install -g @colbymchenry/codegraph || echo "codegraph install skipped (non-fatal)"

  - name: Initialize codegraph index
    run: |
      set -euo pipefail
      if command -v codegraph > /dev/null 2>&1; then
        codegraph init || echo "codegraph init skipped (non-fatal)"
      else
        echo "codegraph not on PATH, skipping index"
      fi

  - name: Install opencode plugin dependencies
    run: |
      set -euo pipefail
      cd .opencode
      if [ -f package.json ]; then
        npm install
        echo "Installed .opencode dependencies:"
        ls node_modules/ | head -5
      else
        echo "No .opencode/package.json found, skipping"
      fi

  - name: Install workspace dependencies
    run: |
      set -euo pipefail
      pnpm install --frozen-lockfile || pnpm install
      echo "Workspace dependencies installed"

  - name: Restore .NET packages
    run: |
      set -euo pipefail
      dotnet restore apps/api/Numa.slnx || echo "dotnet restore skipped (non-fatal)"

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
