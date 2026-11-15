#!/usr/bin/env bash
# Cursor cloud agent startup: wire git to private Forgejo via Cloudflare Access.
# Reads secret *names* from environment — never prints values.
set -euo pipefail

log() { echo "[agent-git-setup] $*" >&2; }

trim_env() {
  local name="$1"
  local val="${!name:-}"
  # Trim leading/trailing whitespace and stray newlines from pasted secrets
  val="${val#"${val%%[![:space:]]*}"}"
  val="${val%"${val##*[![:space:]]}"}"
  val="${val//$'\r'/}"
  val="${val//$'\n'/}"
  printf -v "$name" '%s' "$val"
  export "$name"
}

require_env() {
  local name="$1"
  trim_env "$name"
  if [[ -z "${!name}" ]]; then
    log "Missing required environment variable: ${name}"
    exit 1
  fi
}

require_env FORGEJO_URL
require_env FORGEJO_TOKEN
require_env FORGEJO_CF_ACCESS_CLIENT_ID
require_env FORGEJO_CF_ACCESS_CLIENT_SECRET
require_env FORGEJO_REPO_OWNER
require_env FORGEJO_REPO_NAME

FORGEJO_CLONE_URL="${FORGEJO_URL%/}"
WORKSPACE="${CURSOR_WORKSPACE:-${HOME}/workspace}"
TARGET="${FORGEJO_CLONE_URL}/${FORGEJO_REPO_OWNER}/${FORGEJO_REPO_NAME}.git"
HTTP_CONFIG_KEY="http.${FORGEJO_CLONE_URL}.extraHeader"

export GIT_TERMINAL_PROMPT=0

git config --global credential.helper store

# Idempotent: replace all scoped extraHeaders (re-run safe, no duplicates)
git config --global --unset-all "${HTTP_CONFIG_KEY}" 2>/dev/null || true
git config --global --add "${HTTP_CONFIG_KEY}" "CF-Access-Client-Id: ${FORGEJO_CF_ACCESS_CLIENT_ID}"
git config --global --add "${HTTP_CONFIG_KEY}" "CF-Access-Client-Secret: ${FORGEJO_CF_ACCESS_CLIENT_SECRET}"
git config --global --add "${HTTP_CONFIG_KEY}" "Authorization: token ${FORGEJO_TOKEN}"

# Store credentials for https clone (token as password, oauth2 as user is Gitea convention)
CRED_FILE="${HOME}/.git-credentials"
CRED_HOST="${FORGEJO_CLONE_URL#https://}"
CRED_HOST="${CRED_HOST#http://}"
CRED_LINE="https://oauth2:${FORGEJO_TOKEN}@${CRED_HOST}"
if [[ -f "$CRED_FILE" ]]; then
  grep -vF "@${CRED_HOST}" "$CRED_FILE" >"${CRED_FILE}.tmp" 2>/dev/null || true
  if [[ ! -s "${CRED_FILE}.tmp" ]]; then
  rm -f "$CRED_FILE"
  else
  mv "${CRED_FILE}.tmp" "$CRED_FILE"
  fi
  rm -f "${CRED_FILE}.tmp"
fi
echo "$CRED_LINE" >>"$CRED_FILE"
chmod 600 "$CRED_FILE"

git config --global push.default current

if [[ "${AGENT_GIT_SETUP_SKIP_CLONE:-0}" == "1" ]]; then
  log "Skip clone (AGENT_GIT_SETUP_SKIP_CLONE=1)"
  log "Forgejo git setup complete (no secrets logged)."
  exit 0
fi

if [[ -d "${WORKSPACE}/.git" ]]; then
  log "Workspace already a git repo; setting forgejo remote"
  cd "$WORKSPACE"
  if git remote get-url forgejo >/dev/null 2>&1; then
    git remote set-url forgejo "$TARGET"
  else
    git remote add forgejo "$TARGET"
  fi
  git remote set-url --push origin "$TARGET" 2>/dev/null || true
else
  log "Cloning from Forgejo into workspace"
  rm -rf "${WORKSPACE}.bak" 2>/dev/null || true
  if [[ -d "$WORKSPACE" ]]; then
    mv "$WORKSPACE" "${WORKSPACE}.bak"
  fi
  git clone "$TARGET" "$WORKSPACE"
  cd "$WORKSPACE"
fi

git remote set-url --push origin "$TARGET" 2>/dev/null || git remote add origin "$TARGET"

if [[ -n "${GIT_USER_NAME:-}" ]]; then
  git config user.name "$GIT_USER_NAME"
fi
if [[ -n "${GIT_USER_EMAIL:-}" ]]; then
  git config user.email "$GIT_USER_EMAIL"
fi

log "Forgejo git setup complete (no secrets logged)."