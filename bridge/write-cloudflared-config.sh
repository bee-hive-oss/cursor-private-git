#!/usr/bin/env bash
# Write cloudflared ingress config from bridge/cloudflared-config.example.yml (no root).
# Run from your checkout; paths below are repo-relative or under $HOME only.
set -euo pipefail

BRIDGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${BRIDGE_DIR}/cloudflared-config.example.yml"

usage() {
  cat <<'EOF' >&2
Usage: set required env vars, then run from repo checkout:

  export CF_TUNNEL_ID="<TUNNEL_ID>"
  export FORGEJO_PUBLIC_HOST="git.example.com"
  export CF_TEAM_NAME="<TEAM_NAME>"
  export CF_ACCESS_APPLICATION_AUD="<APPLICATION_AUD>"

Optional:
  export CF_TUNNEL_CREDENTIALS_FILE="$HOME/.cloudflared/<TUNNEL_ID>.json"
  export FORGEJO_LOCAL_URL="http://127.0.0.1:3000"
  export CLOUDFLARED_CONFIG_OUTPUT="$HOME/.config/cursor-private-git/cloudflared-config.yml"

Then:
  bash bridge/write-cloudflared-config.sh

APPLICATION AUD (Access):
  Zero Trust → Access → Applications → your app → **Additional settings**.
  Copy **Application Audience (AUD) Tag** (64-character hex string).
  Paste into CF_ACCESS_APPLICATION_AUD (no quotes in the env var; script adds YAML quotes).
EOF
}

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "[write-cloudflared-config] missing: ${name}" >&2
    usage
    exit 1
  fi
}

require_var CF_TUNNEL_ID
require_var FORGEJO_PUBLIC_HOST
require_var CF_TEAM_NAME
require_var CF_ACCESS_APPLICATION_AUD

CF_TUNNEL_CREDENTIALS_FILE="${CF_TUNNEL_CREDENTIALS_FILE:-${HOME}/.cloudflared/${CF_TUNNEL_ID}.json}"
FORGEJO_LOCAL_URL="${FORGEJO_LOCAL_URL:-http://127.0.0.1:3000}"
OUTPUT="${CLOUDFLARED_CONFIG_OUTPUT:-${HOME}/.config/cursor-private-git/cloudflared-config.yml}"

# Normalize APPLICATION AUD: trim whitespace; strip accidental quotes or aud: prefix
AUD="${CF_ACCESS_APPLICATION_AUD}"
AUD="${AUD#"${AUD%%[![:space:]]*}"}"
AUD="${AUD%"${AUD##*[![:space:]]}"}"
AUD="${AUD//$'\r'/}"
AUD="${AUD//$'\n'/}"
AUD="${AUD#\"}"
AUD="${AUD%\"}"
AUD="${AUD#aud:}"

if [[ ! "$AUD" =~ ^[0-9a-fA-F]{64}$ ]]; then
  echo "[write-cloudflared-config] CF_ACCESS_APPLICATION_AUD must be 64 hex chars (Application Audience AUD Tag, Additional settings tab)" >&2
  exit 1
fi

if [[ ! -f "$TEMPLATE" ]]; then
  echo "[write-cloudflared-config] template not found: ${TEMPLATE}" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")"

# Escape sed replacement (paths may contain /)
esc() { printf '%s' "$1" | sed 's/[&/\]/\\&/g'; }

sed \
  -e "s|<TUNNEL_ID>|$(esc "$CF_TUNNEL_ID")|g" \
  -e "s|<TUNNEL_CREDENTIALS_FILE>|$(esc "$CF_TUNNEL_CREDENTIALS_FILE")|g" \
  -e "s|<FORGEJO_PUBLIC_HOST>|$(esc "$FORGEJO_PUBLIC_HOST")|g" \
  -e "s|<FORGEJO_LOCAL_URL>|$(esc "$FORGEJO_LOCAL_URL")|g" \
  -e "s|<TEAM_NAME>|$(esc "$CF_TEAM_NAME")|g" \
  -e "s|<APPLICATION_AUD>|$(esc "$AUD")|g" \
  "$TEMPLATE" >"$OUTPUT"

chmod 600 "$OUTPUT"
echo "[write-cloudflared-config] wrote ${OUTPUT}"