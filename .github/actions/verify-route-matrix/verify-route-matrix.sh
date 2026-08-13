#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTER_YML="${HERE}/../../workflows/work-router.yml"
CLASSIFIER="${HERE}/../classify-route/classify-route.sh"

bash -n "$CLASSIFIER"

for route in direct; do
  grep -q "route == '$route'" "$ROUTER_YML" || {
    echo "FAIL: selected route '$route' has no router job" >&2
    exit 1
  }
done

for route in refine implement apply-review merge-gate audit propose; do
  if grep -q "route == '$route'" "$ROUTER_YML"; then
    echo "FAIL: excluded route '$route' remains in router" >&2
    exit 1
  fi
done

echo "Route matrix: selected routes valid"
