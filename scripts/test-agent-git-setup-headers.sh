#!/usr/bin/env bash
# Test idempotent http.extraHeader setup (no network, no secrets printed).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_HOME="$(mktemp -d)"
TEST_GITCONFIG="${TEST_HOME}/.gitconfig"
trap 'rm -rf "$TEST_HOME"' EXIT

export HOME="$TEST_HOME"
export GIT_CONFIG_GLOBAL="$TEST_GITCONFIG"
export FORGEJO_URL="https://git.example.com"
export FORGEJO_TOKEN="pat-test-token"
export FORGEJO_CF_ACCESS_CLIENT_ID="client-id-test"
export FORGEJO_CF_ACCESS_CLIENT_SECRET="client-secret-test"
export FORGEJO_REPO_OWNER="acme"
export FORGEJO_REPO_NAME="app"
export AGENT_GIT_SETUP_SKIP_CLONE=1

KEY="http.https://git.example.com.extraHeader"

run_setup() {
  bash "${REPO_ROOT}/scripts/agent-git-setup.sh" >/dev/null
}

run_setup
run_setup

mapfile -t HEADERS < <(git config --global --get-all "$KEY" 2>/dev/null || true)

if [[ "${#HEADERS[@]}" -ne 3 ]]; then
  echo "FAIL: expected 3 extraHeader values, got ${#HEADERS[@]}" >&2
  printf ' %q\n' "${HEADERS[@]}" >&2
  exit 1
fi

for h in "${HEADERS[@]}"; do
  if [[ -z "${h//[[:space:]]/}" ]]; then
    echo "FAIL: empty extraHeader entry" >&2
    exit 1
  fi
done

case "${HEADERS[0]}" in
  "CF-Access-Client-Id: client-id-test") ;;
  *) echo "FAIL: header 1 mismatch" >&2; exit 1 ;;
esac
case "${HEADERS[1]}" in
  "CF-Access-Client-Secret: client-secret-test") ;;
  *) echo "FAIL: header 2 mismatch" >&2; exit 1 ;;
esac
case "${HEADERS[2]}" in
  "Authorization: token pat-test-token") ;;
  *) echo "FAIL: header 3 mismatch" >&2; exit 1 ;;
esac

# Trim test: secret with trailing newline
export FORGEJO_CF_ACCESS_CLIENT_ID=$'id-with-trailing\n'
export FORGEJO_CF_ACCESS_CLIENT_SECRET=$'secret-with-trailing\n'
export FORGEJO_TOKEN=$'token-with-trailing\n'
run_setup
mapfile -t HEADERS2 < <(git config --global --get-all "$KEY")
if [[ "${HEADERS2[0]}" != "CF-Access-Client-Id: id-with-trailing" ]]; then
  echo "FAIL: trim did not remove newline from client id" >&2
  exit 1
fi

echo "PASS: agent-git-setup headers idempotent (3 non-empty headers, trim ok)"