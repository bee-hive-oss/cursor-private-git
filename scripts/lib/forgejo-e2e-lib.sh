#!/usr/bin/env bash
# Shared throwaway Forgejo for e2e + MCP integration tests (no root/Docker).
set -euo pipefail

_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config/forgejo.env
source "${_LIB_DIR}/../../config/forgejo.env"

forgejo_e2e_arch() {
  case "$(uname -m)" in
    x86_64) echo amd64 ;;
    aarch64|arm64) echo arm64 ;;
    *) echo "unsupported arch: $(uname -m)" >&2; return 1 ;;
  esac
}

forgejo_e2e_version() {
  echo "${FORGEJO_VERSION:?}"
}

forgejo_e2e_binary() {
  local bin_dir="${FORGEJO_E2E_BIN:-/tmp/forgejo-bin}"
  local version arch url fj_bin
  version="$(forgejo_e2e_version)"
  arch="$(forgejo_e2e_arch)"
  mkdir -p "$bin_dir"
  fj_bin="${bin_dir}/forgejo-${version}"
  if [[ ! -x "$fj_bin" ]]; then
    url="https://codeberg.org/forgejo/forgejo/releases/download/v${version}/forgejo-${version}-linux-${arch}"
    echo "[forgejo-e2e] downloading Forgejo v${version} (${arch})" >&2
    curl -fsSL "$url" -o "$fj_bin"
    chmod +x "$fj_bin"
  fi
  echo "$fj_bin"
}

forgejo_e2e_write_app_ini() {
  local data_dir="$1" port="$2"
  mkdir -p "${data_dir}/custom/conf" "${data_dir}/data/repos"
  cat >"${data_dir}/custom/conf/app.ini" <<EOF
APP_NAME = Forgejo E2E
RUN_MODE = prod

[repository]
ROOT = ${data_dir}/data/repos

[server]
HTTP_ADDR = 127.0.0.1
HTTP_PORT = ${port}
DOMAIN = 127.0.0.1
ROOT_URL = http://127.0.0.1:${port}/
DISABLE_SSH = true
LFS_START_SERVER = false

[database]
DB_TYPE = sqlite3
PATH = ${data_dir}/data/gitea.db

[security]
INSTALL_LOCK = false
EOF
}

forgejo_e2e_wait_http() {
  local port="$1" max="${2:-60}"
  local i code
  for ((i = 1; i <= max; i++)); do
    code="$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${port}/" 2>/dev/null || echo 000)"
    if [[ "$code" =~ ^(200|302|303|405)$ ]]; then
      return 0
    fi
    if curl -fsS "http://127.0.0.1:${port}/api/v1/version" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

forgejo_e2e_run_install() {
  local port="$1" data_dir="$2"
  local base="http://127.0.0.1:${port}"
  if curl -fsS "${base}/api/v1/version" >/dev/null 2>&1; then
    echo "[forgejo-e2e] already installed" >&2
    return 0
  fi
  echo "[forgejo-e2e] running web installer" >&2
  local cookie_jar
  cookie_jar="$(mktemp)"
  curl -fsS -c "$cookie_jar" "${base}/" -o /dev/null
  local resp http_code
  resp="$(mktemp)"
  http_code="$(
    curl -sS -b "$cookie_jar" -c "$cookie_jar" -o "$resp" -w "%{http_code}" -X POST "${base}/" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      --data-urlencode "db_type=sqlite3" \
      --data-urlencode "db_path=${data_dir}/data/gitea.db" \
      --data-urlencode "ssl_mode=disable" \
      --data-urlencode "db_schema=" \
      --data-urlencode "charset=utf8" \
      --data-urlencode "app_name=Forgejo E2E" \
      --data-urlencode "app_slogan=" \
      --data-urlencode "repo_root_path=${data_dir}/data/repos" \
      --data-urlencode "lfs_root_path=${data_dir}/data/lfs" \
      --data-urlencode "run_user=$(whoami)" \
      --data-urlencode "domain=127.0.0.1" \
      --data-urlencode "ssh_port=22" \
      --data-urlencode "http_port=${port}" \
      --data-urlencode "app_url=${base}/" \
      --data-urlencode "log_root_path=${data_dir}/log" \
      --data-urlencode "admin_name=e2eadmin" \
      --data-urlencode "admin_passwd=e2eadmin-pass" \
      --data-urlencode "admin_confirm_passwd=e2eadmin-pass" \
      --data-urlencode "admin_email=e2e@example.com" \
      --data-urlencode "disable_registration=on" \
      --data-urlencode "offline_mode=on" \
      --data-urlencode "disable_gravatar=on"
  )"
  rm -f "$cookie_jar"
  if grep -q "flash-error" "$resp" 2>/dev/null; then
    grep -oP '(?<=<p>)[^<]+' "$resp" | head -3 >&2 || true
    rm -f "$resp"
    echo "[forgejo-e2e] install form rejected" >&2
    return 1
  fi
  rm -f "$resp"
  if [[ "$http_code" != "303" && "$http_code" != "302" && "$http_code" != "200" ]]; then
    echo "[forgejo-e2e] unexpected HTTP ${http_code} from install" >&2
    return 1
  fi
  for _ in $(seq 1 45); do
    if curl -fsS "${base}/api/v1/version" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "[forgejo-e2e] install did not expose API" >&2
  return 1
}

forgejo_e2e_create_token() {
  local fj_bin="$1" data_dir="$2"
  local out
  if ! out="$(
    "$fj_bin" admin user generate-access-token \
      --work-path "$data_dir" \
      --username e2eadmin \
      --token-name "e2e-$(date +%s)" \
      --scopes "all" \
      --raw 2>&1
  )"; then
    echo "[forgejo-e2e] token command failed" >&2
    return 1
  fi
  echo "$out" | tail -n 1
}

forgejo_e2e_port_in_use() {
  local p="$1"
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$p" >/dev/null 2>&1
    return $?
  fi
  (echo >/dev/tcp/127.0.0.1/"$p") 2>/dev/null
}

forgejo_e2e_pick_port() {
  local p
  for p in $(seq "${FORGEJO_E2E_PORT_START:-3310}" "${FORGEJO_E2E_PORT_END:-3399}"); do
    if ! forgejo_e2e_port_in_use "$p"; then
      echo "$p"
      return 0
    fi
  done
  echo "[forgejo-e2e] no free port in range" >&2
  return 1
}

forgejo_e2e_start() {
  local port="${FORGEJO_E2E_PORT:-}"
  if [[ -z "$port" ]] || forgejo_e2e_port_in_use "$port"; then
    [[ -n "$port" ]] && echo "[forgejo-e2e] port ${port} busy; picking another" >&2
    port="$(forgejo_e2e_pick_port)"
  fi
  local data_dir="${FORGEJO_E2E_DATA:-/tmp/forgejo-e2e-$$}"
  local fj_bin
  fj_bin="$(forgejo_e2e_binary)"
  forgejo_e2e_write_app_ini "$data_dir" "$port"

  "$fj_bin" web --work-path "$data_dir" &
  local pid=$!
  export FORGEJO_E2E_PID="$pid"
  export FORGEJO_E2E_DATA="$data_dir"
  export FORGEJO_E2E_PORT="$port"
  export FORGEJO_E2E_BIN_PATH="$fj_bin"
  export FORGEJO_E2E_BASE_URL="http://127.0.0.1:${port}"

  if ! forgejo_e2e_wait_http "$port" 90; then
    echo "[forgejo-e2e] Forgejo HTTP timeout" >&2
    return 1
  fi
  forgejo_e2e_run_install "$port" "$data_dir"

  local token
  token="$(forgejo_e2e_create_token "$fj_bin" "$data_dir")"
  if [[ -z "$token" ]]; then
    echo "[forgejo-e2e] failed to mint access token" >&2
    return 1
  fi
  export FORGEJO_E2E_TOKEN="$token"
  export FORGEJO_URL="$FORGEJO_E2E_BASE_URL"
  export FORGEJO_TOKEN="$token"
  echo "[forgejo-e2e] Forgejo v$(forgejo_e2e_version) ready at ${FORGEJO_E2E_BASE_URL}" >&2
}

forgejo_e2e_stop() {
  if [[ -n "${FORGEJO_E2E_PID:-}" ]]; then
    kill "${FORGEJO_E2E_PID}" 2>/dev/null || true
    wait "${FORGEJO_E2E_PID}" 2>/dev/null || true
  fi
  if [[ -n "${FORGEJO_E2E_DATA:-}" ]] && [[ "${FORGEJO_E2E_KEEP_DATA:-0}" != "1" ]]; then
    rm -rf "${FORGEJO_E2E_DATA}"
  fi
}