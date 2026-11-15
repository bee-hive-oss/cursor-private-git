#!/usr/bin/env bash
# Cursor cloud agent install: build forgejo-mcp before MCP attaches.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${REPO_ROOT}/mcp/forgejo-mcp"

if ! command -v npm >/dev/null 2>&1; then
  echo "[install-agent-environment] npm not found on PATH" >&2
  exit 1
fi

npm install
npm run build

if [[ ! -f "${REPO_ROOT}/mcp/forgejo-mcp/dist/index.js" ]]; then
  echo "[install-agent-environment] build failed: dist/index.js missing" >&2
  exit 1
fi

echo "[install-agent-environment] forgejo-mcp built successfully"