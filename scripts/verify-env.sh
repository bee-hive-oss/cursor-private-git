#!/usr/bin/env bash
# Check required env vars are set (names only in output).
set -euo pipefail

REQUIRED=(
  FORGEJO_URL
  FORGEJO_TOKEN
  FORGEJO_CF_ACCESS_CLIENT_ID
  FORGEJO_CF_ACCESS_CLIENT_SECRET
  FORGEJO_REPO_OWNER
  FORGEJO_REPO_NAME
)

missing=0
for v in "${REQUIRED[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "MISSING ${v}" >&2
    missing=1
  else
    echo "OK ${v}"
  fi
done

exit "$missing"