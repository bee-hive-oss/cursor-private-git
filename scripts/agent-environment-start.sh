#!/usr/bin/env bash
# Cursor start: ensure MCP dist exists, then run git setup.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${REPO_ROOT}/mcp/forgejo-mcp/dist/index.js"

# install runs only on Cursor Environment Builds; start must be self-sufficient.
bash "${REPO_ROOT}/scripts/install-agent-environment.sh"

exec bash "${REPO_ROOT}/scripts/agent-git-setup.sh"