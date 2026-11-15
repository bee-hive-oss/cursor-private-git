# Network bridge (Forgejo on laptop → Cursor VMs)

Forgejo binds **127.0.0.1:3000** on the operator machine. Cursor cloud agents reach it through a **Cloudflare Tunnel** (`cloudflared`) run as your normal user — no root, no home-router port forward.

**Create the Access application and policy before** you route DNS or start the tunnel ([SETUP.md](../docs/SETUP.md)).

## Architecture

```
[Forgejo :3000 localhost] ←→ [cloudflared] ←→ [Cloudflare edge]
                                              ↑
                         [CF Access: service token required]
                                              ↑
                         [Cursor VM: agent-git-setup + MCP]
```

## Prerequisites

- Cloudflare account with Zero Trust enabled
- Forgejo on `127.0.0.1:3000`
- `bash bridge/install-cloudflared-user.sh` on `PATH`

## 1. Zero Trust (before tunnel)

Follow **Steps 3–4** in [docs/SETUP.md](../docs/SETUP.md): service token, self-hosted Access app, **Application Audience (AUD) Tag** (64 hex chars, **Additional settings** tab).

## 2. Tunnel create + DNS

```bash
cloudflared tunnel login
export CF_TUNNEL_NAME="forgejo-agent"
export FORGEJO_PUBLIC_HOST="git.example.com"
cloudflared tunnel create "${CF_TUNNEL_NAME}"
cloudflared tunnel route dns "${CF_TUNNEL_NAME}" "${FORGEJO_PUBLIC_HOST}"
```

## 3. Generate config (script)

```bash
export CF_TUNNEL_ID="<TUNNEL_ID>"
export FORGEJO_PUBLIC_HOST="git.example.com"
export CF_TEAM_NAME="<TEAM_NAME>"
export CF_ACCESS_APPLICATION_AUD="<64_HEX_AUD_TAG>"

bash bridge/write-cloudflared-config.sh
```

Output: `~/.config/cursor-private-git/cloudflared-config.yml`

## 4. systemd --user

```bash
cp bridge/systemd-user/cloudflared-forgejo.service ~/.config/systemd/user/
systemctl --user enable --now cloudflared-forgejo.service
loginctl enable-linger "$USER"
```

## 5. Verify

See **Step 8** in [SETUP.md](../docs/SETUP.md): no headers → Access block (403/401), not Forgejo JSON.

## Environment variables (names only)

| Variable | Purpose |
|----------|---------|
| `CF_TUNNEL_ID` | Tunnel UUID |
| `CF_TUNNEL_NAME` | Tunnel name |
| `CF_TEAM_NAME` | Zero Trust team slug |
| `CF_ACCESS_APPLICATION_AUD` | 64-char Application Audience (AUD) Tag |
| `FORGEJO_PUBLIC_HOST` | Public hostname |
| `FORGEJO_LOCAL_URL` | Upstream (default loopback) |
| `FORGEJO_CF_ACCESS_CLIENT_*` | Service token for agents |