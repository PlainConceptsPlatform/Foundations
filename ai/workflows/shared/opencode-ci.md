---
description: |
  Merges the CI-only OpenCode provider from opencode.ci.json into opencode.jsonc before the
  agent starts. Import it from every agentic workflow, so the merge is defined once.

  Why this file exists at all: `opencode.jsonc` is a developer's local config and is not
  tracked, so it does not exist in a CI checkout. Without something like this, the only
  config the agent gets is the one gh-aw generates, which declares provider `awf-proxy` with
  its own default model — while the workflow asks for ours.

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
