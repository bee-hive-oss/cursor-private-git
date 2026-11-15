#!/usr/bin/env bash
# Install cloudflared into ~/.local/bin — no root, no sudo.
set -euo pipefail

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) CF_ARCH=amd64 ;;
  aarch64|arm64) CF_ARCH=arm64 ;;
  *)
    echo "Unsupported architecture: $ARCH" >&2
    exit 1
    ;;
esac

VERSION="${CLOUDFLARED_VERSION:-2024.8.2}"
URL="https://github.com/cloudflare/cloudflared/releases/download/${VERSION}/cloudflared-linux-${CF_ARCH}"

BIN_DIR="${HOME}/.local/bin"
mkdir -p "$BIN_DIR"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

echo "Downloading cloudflared ${VERSION} (${CF_ARCH})..."
curl -fsSL "$URL" -o "$TMP"
chmod +x "$TMP"
mv "$TMP" "${BIN_DIR}/cloudflared"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "Add to PATH: export PATH=\"\${HOME}/.local/bin:\$PATH\"" >&2
fi

"${BIN_DIR}/cloudflared" --version