#!/usr/bin/env bash
set -euo pipefail

# Run all repository checks in one batch and stop at the first failure.

run() {
  echo "» $*"
  "$@"
}

run bun run check-types
run bun run test
run bun run lint
run bun run fmt:check
run bun run build

echo "✓ all checks passed"
