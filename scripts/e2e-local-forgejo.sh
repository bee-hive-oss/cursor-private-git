#!/usr/bin/env bash
# Full local e2e: Forgejo binary (see config/forgejo.env), install, git clone/push, MCP integration.
# No Docker, no root.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/forgejo-e2e-lib.sh
source "${REPO_ROOT}/scripts/lib/forgejo-e2e-lib.sh"

REPO_NAME="${FORGEJO_E2E_REPO:-cursor-e2e}"
E2E_BRANCH="e2e/feature-$(date +%s)"

cleanup() {
  forgejo_e2e_stop
  rm -rf "${CLONE_DIR:-}" 2>/dev/null || true
}
trap cleanup EXIT

echo "[e2e] Forgejo version: $(forgejo_e2e_version)"
forgejo_e2e_start

api() {
  curl -fsS -H "Authorization: token ${FORGEJO_TOKEN}" \
    -H "Content-Type: application/json" \
    "$@"
}

echo "[e2e] creating repository ${REPO_NAME}"
api -X POST "${FORGEJO_URL}/api/v1/user/repos" \
  -d "{\"name\":\"${REPO_NAME}\",\"auto_init\":true,\"default_branch\":\"main\",\"private\":false}" >/dev/null

CLONE_DIR="$(mktemp -d)"
clone_url="http://oauth2:${FORGEJO_TOKEN}@127.0.0.1:${FORGEJO_E2E_PORT}/e2eadmin/${REPO_NAME}.git"
export GIT_TERMINAL_PROMPT=0
git -c http.sslVerify=false clone "$clone_url" "$CLONE_DIR"
cd "$CLONE_DIR"
git checkout -b "$E2E_BRANCH"
echo "e2e-marker-$(date +%s)" >>README.md
git add README.md
git -c user.email=e2e@example.com -c user.name="E2E Agent" commit -m "e2e: feature commit"
git -c http.sslVerify=false push -u origin "$E2E_BRANCH"
echo "[e2e] pushed branch ${E2E_BRANCH}"
HEAD_SHA="$(git rev-parse HEAD)"
echo "[e2e] head sha ${HEAD_SHA}"

export FORGEJO_REPO_OWNER=e2eadmin
export FORGEJO_REPO_NAME="$REPO_NAME"
export FORGEJO_E2E_BRANCH="$E2E_BRANCH"
export FORGEJO_E2E_HEAD_SHA="$HEAD_SHA"

echo "[e2e] running MCP live integration tests"
cd "${REPO_ROOT}/mcp/forgejo-mcp"
npm run build >/dev/null
npm run test:integration
echo "[e2e] all steps passed"