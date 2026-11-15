#!/usr/bin/env bash
# MCP stdio entry: build dist if missing, then run forgejo-mcp (cloud-safe cwd).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${REPO_ROOT}/mcp/forgejo-mcp/dist/index.js"

if [[ ! -f "$DIST" ]]; then
  echo "[run-forgejo-mcp] dist missing; building" >&2
  bash "${REPO_ROOT}/scripts/install-agent-environment.sh"
fi

exec node "$DIST"