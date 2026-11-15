# Full setup guide

Connect **Cursor Cloud Agents** to a **private Forgejo** on your machine using a **Cloudflare Tunnel** and **Access service tokens**. GitHub stays a **launch placeholder** only.

Prerequisites: a machine you control (laptop or home server), a Cloudflare account, Forgejo **17.0.1** (or match `config/forgejo.env`), Node.js on the agent image (for MCP rebuilds).

**Order matters:** create the **Access application and policy before** you publish the tunnel route or start `cloudflared`, so the hostname is never open without Zero Trust.

---

## Step 1 — Forgejo on loopback

1. Run Forgejo bound to **127.0.0.1:3000** (not the LAN) unless you intend a public LAN service.
2. In Forgejo `app.ini`, set `ROOT_URL` to match your eventual public URL, e.g. `https://git.example.com/`.
3. Create a user account you will use for agent PATs.

---

## Step 2 — Install `cloudflared` in your home directory (no root)

```bash
bash bridge/install-cloudflared-user.sh
export PATH="$HOME/.local/bin:$PATH"
cloudflared --version
```

Log in (browser opens):

```bash
cloudflared tunnel login
```

**Gotcha:** the login command writes `~/.cloudflared/cert.pem`. Keep this file; tunnel credentials depend on it. Do not commit it.

You are **not** starting the tunnel yet.

---

## Step 3 — Cloudflare Zero Trust: team, service token, Access app

Do this **before** tunnel DNS or `cloudflared run`.

### Enable Zero Trust

1. Open the Cloudflare dashboard → **Zero Trust**.
2. If prompted, activate Zero Trust (**Free plan** is fine).
3. Choose a **team name** — this becomes your `<TEAM_NAME>` (URL segment like `https://<TEAM_NAME>.cloudflareaccess.com`).

### Create a service token

1. **Zero Trust → Access → Access controls → Service credentials** (or **Service auth → Service tokens**).
2. **Create service token** — name it (e.g. `cursor-agent`), pick a duration.
3. Copy **Client ID** and **Client Secret** immediately. The **secret is shown only once**.
4. Save these for Cursor later as `FORGEJO_CF_ACCESS_CLIENT_ID` and `FORGEJO_CF_ACCESS_CLIENT_SECRET`.

### Create the Access application

1. **Access → Applications → Add an application**.
2. Type: **Self-hosted**.
3. **Public hostname:** your subdomain + domain (e.g. `git` + `example.com` → `git.example.com`).
4. **Policies → Add a policy:**
   - **Action:** Allow
   - **Configure rules → Include:** **Service Auth**
   - **Selector:** **Service Token** = the token you just created
5. Save the application.

---

## Step 4 — Application Audience (AUD) tag

Still **before** starting the tunnel:

1. Open the Access application you created.
2. Go to the **Additional settings** tab.
3. Find **Application Audience (AUD) Tag** — a **64-character hexadecimal** string (not a UUID).
4. Copy the full value into `CF_ACCESS_APPLICATION_AUD` when you run the config script in Step 6.

Example shape only: `<64_LOWERCASE_OR_MIXED_HEX_CHARS>`

---

## Step 5 — Create tunnel and DNS route

```bash
export CF_TUNNEL_NAME="forgejo-agent"
export FORGEJO_PUBLIC_HOST="git.example.com"
cloudflared tunnel create "$CF_TUNNEL_NAME"
cloudflared tunnel route dns "$CF_TUNNEL_NAME" "$FORGEJO_PUBLIC_HOST"
```

Note the tunnel **UUID** printed by `tunnel create` (`<TUNNEL_ID>`).

---

## Step 6 — Generate `cloudflared` config (script)

From your **repo checkout** (any path):

```bash
export CF_TUNNEL_ID="<TUNNEL_ID>"
export FORGEJO_PUBLIC_HOST="git.example.com"
export CF_TEAM_NAME="<TEAM_NAME>"
export CF_ACCESS_APPLICATION_AUD="<APPLICATION_AUD_TAG>"
# optional: export CF_TUNNEL_CREDENTIALS_FILE="$HOME/.cloudflared/<TUNNEL_ID>.json"
# optional: export FORGEJO_LOCAL_URL="http://127.0.0.1:3000"

bash bridge/write-cloudflared-config.sh
```

Writes **`~/.config/cursor-private-git/cloudflared-config.yml`** (matches `bridge/systemd-user/cloudflared-forgejo.service`). Template: `bridge/cloudflared-config.example.yml`.

Optional output path:

```bash
export CLOUDFLARED_CONFIG_OUTPUT="$HOME/.cloudflared/config.yml"
bash bridge/write-cloudflared-config.sh
```

The script sets `originRequest.access` with your team name and AUD tag. Includes a required **404 catch-all** ingress rule.

---

## Step 7 — systemd user service and start tunnel (no root)

Only after Steps 3–6 are complete:

```bash
mkdir -p ~/.config/systemd/user
cp bridge/systemd-user/cloudflared-forgejo.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now cloudflared-forgejo.service
loginctl enable-linger "$USER"
systemctl --user status cloudflared-forgejo.service
```

---

## Step 8 — Verify tunnel and Access

**Without** Access headers — expect a **Cloudflare Access error page**, not Forgejo JSON:

- Usually **HTTP 403** (default Access block)
- **HTTP 401** if the application has **Return 401 for login required client-side assets** enabled

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://git.example.com/api/v1/version"
```

If you get **HTTP 200 with Forgejo JSON without headers**, **stop the tunnel** immediately and fix `originRequest.access` — see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

**With** service token headers — expect **HTTP 200** and Forgejo version JSON:

```bash
export FORGEJO_CF_ACCESS_CLIENT_ID="..."
export FORGEJO_CF_ACCESS_CLIENT_SECRET="..."
curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "CF-Access-Client-Id: ${FORGEJO_CF_ACCESS_CLIENT_ID}" \
  -H "CF-Access-Client-Secret: ${FORGEJO_CF_ACCESS_CLIENT_SECRET}" \
  "https://git.example.com/api/v1/version"
```

**HTTP 530** means the tunnel connector is down — see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## Step 9 — Forgejo personal access token and repository

Path: click your **avatar (top right) → Settings → Applications → Generate new token**.

Enable at least:

| Scope | Why |
|-------|-----|
| `read:user` | `/api/v1/user` and user-scoped calls |
| `write:user` | Create repositories via API (optional if you only use the UI) |
| `read:repository` | Clone, read, list branches |
| `write:repository` | Push, open pull requests |
| `read:issue` / `write:issue` | Issues and PRs via MCP (as needed) |

1. Generate the token; store as `FORGEJO_TOKEN` in Cursor later.
2. Create the **canonical repo** with an initial **README** on `main` (do not leave an empty repo).

Note **owner** and **repo name**: `FORGEJO_REPO_OWNER`, `FORGEJO_REPO_NAME`.

---

## Step 10 — Cursor secrets

1. **Cursor Dashboard → Cloud Agents → My Secrets** (or your team environment).
2. Add these names (paste carefully — no trailing spaces/newlines):

| Secret | Purpose |
|--------|---------|
| `FORGEJO_URL` | `https://git.example.com` |
| `FORGEJO_TOKEN` | Forgejo PAT |
| `FORGEJO_CF_ACCESS_CLIENT_ID` | Service token client id |
| `FORGEJO_CF_ACCESS_CLIENT_SECRET` | Service token secret |
| `FORGEJO_REPO_OWNER` | Forgejo user or org |
| `FORGEJO_REPO_NAME` | Repository name |

3. See `.env.example` for names only — never commit real `.env`.

4. After changing secrets, start a **new** cloud agent (existing VMs may keep old env).

---

## Step 11 — Forgejo MCP on cloud agents (Custom MCP)

**Proven on cold boot:** [Cloud Agents](https://cursor.com/docs/cloud-agent/capabilities) **do not** read `.cursor/mcp.json` from the cloned repo. That file still applies to **Cursor IDE and CLI** only.

Operators must attach Forgejo MCP per user or team:

- **Per agent:** MCP dropdown at [cursor.com/agents](https://cursor.com/agents) when starting or configuring an agent.
- **Team default:** **Dashboard → Plugins & MCPs** (team admins).

Add a personal **Custom MCP** with transport **Command (stdio)**:

| Field | Value |
|-------|--------|
| **command** | `bash` |
| **args** | `["-lc", "cd /agent/repos/cursor-private-git 2>/dev/null || cd /workspace 2>/dev/null; exec bash scripts/run-forgejo-mcp.sh"]` |

**Do not** put `FORGEJO_*` (or any secrets) in the MCP config. The MCP process inherits **Environment secrets** from Cursor the same way git setup does.

After adding or changing the Custom MCP, start a **new** cloud agent. **Running sessions keep the MCP set from when they started.**

Approve the server if Cursor prompts you; you should see `forgejo_*` tools in chat.

---

## Step 12 — Launch agent and verify

1. **Merge** this repository’s `.cursor/environment.json` to the **default branch** on GitHub first (so saved environments can pick it up).
2. **Dashboard → Cloud Agents → Environments** → open your saved environment → set **environment.json location** to this repo’s **`.cursor/environment.json`** (not None) → **Build** successfully ([CURSOR-ENVIRONMENT.md](CURSOR-ENVIRONMENT.md)).
3. If the saved environment **ignores** `environment.json` (hooks never run), set scripts manually on the environment, then **Build**: **Install Script** `bash scripts/install-agent-environment.sh`, **Start Script** `bash scripts/agent-environment-start.sh` ([CURSOR-ENVIRONMENT.md](CURSOR-ENVIRONMENT.md)).
4. Complete **Step 11** (Custom MCP) before or when launching.
5. If hooks still did not run on an old VM: `bash scripts/agent-environment-start.sh` from the checkout.
6. Start a **new** **Cloud Agent** from the GitHub placeholder repo.
7. On the VM:

```bash
bash scripts/verify-env.sh
git remote -v
bash scripts/test-agent-git-setup-headers.sh
```

8. Push a throwaway branch to **Forgejo**; confirm it does **not** appear on GitHub.
9. List `forgejo_*` MCP tools in chat (confirms Step 11).
10. Optional: `scripts/e2e-local-forgejo.sh` on the operator machine.