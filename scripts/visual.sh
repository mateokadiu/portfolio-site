#!/usr/bin/env bash
# Runs the visual-regression suite inside the official Playwright image that
# matches the installed @playwright/test version, so screenshots are rendered
# identically on any machine and in CI. Pass --update-snapshots to re-baseline.
# Requires Docker and a built dist/ (`pnpm build`).
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(node -p "require('@playwright/test/package.json').version")
image="mcr.microsoft.com/playwright:v${version}-noble"

exec docker run --rm --ipc=host \
  -v "$PWD":/work -w /work \
  -e CI=1 -e PW_VISUAL=1 \
  "$image" \
  node node_modules/@playwright/test/cli.js test --project=visual-desktop --project=visual-mobile "$@"
