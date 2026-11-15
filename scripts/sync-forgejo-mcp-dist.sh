#!/usr/bin/env bash
# Commit-ready: rebuild and verify mcp/forgejo-mcp/dist for cold-boot agents.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "${REPO_ROOT}/scripts/install-agent-environment.sh"
test -f "${REPO_ROOT}/mcp/forgejo-mcp/dist/index.js"
echo "OK: mcp/forgejo-mcp/dist/index.js"