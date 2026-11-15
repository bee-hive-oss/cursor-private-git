# Troubleshooting

Plain-English fixes for issues seen in real agent and tunnel tests. Use placeholders in your own commands (`git.example.com`, etc.).

## Saved environment ignores `.cursor/environment.json` (install/start never run)

**Symptoms:** Fresh agent has no `mcp/forgejo-mcp/dist/`, git setup looks wrong, hooks never logged anything.

**Cause:** A **saved Cloud Agents environment** created **before** `.cursor/environment.json` existed on the **default branch** often keeps **environment.json location: None**. Cursor then skips repo hooks entirely ([environment resolution order](https://cursor.com/docs/cloud-agent/setup)).

**Fix (in order):**

1. **Merge** (or make default) a branch that includes `.cursor/environment.json` on the repo’s **default branch** first.
2. **Dashboard → Cloud Agents → Environments** → open the saved environment used for this repo.
3. Set **environment.json location** to this repository’s **`.cursor/environment.json`** (not None).
4. Click **Build** and wait for **success**.
5. Start a **new** cloud agent (not an old session).

**Manual fallback on a running VM** (from repo checkout):

```bash
bash scripts/agent-environment-start.sh
```

That runs MCP build if needed and git setup. Still fix the Dashboard location + Build so the next cold boot is automatic.

**Dashboard script fallback:** If linking `environment.json` still does not run hooks, set **Install Script** to `bash scripts/install-agent-environment.sh` and **Start Script** to `bash scripts/agent-environment-start.sh`, then **Build** ([CURSOR-ENVIRONMENT.md](CURSOR-ENVIRONMENT.md)).

## Tunnel and Access

### HTTP 530 from Cloudflare

**Meaning:** Cloudflare cannot reach your tunnel connector.

**Checks:**

1. `systemctl --user status cloudflared-forgejo.service` (or your unit name).
2. `journalctl --user -u cloudflared-forgejo.service -n 50`
3. Confirm `cloudflared tunnel run` uses the correct `config.yml` and credentials JSON.

### HTTP 200 on Forgejo API **without** Access headers

**Meaning:** Origin is not locked to Access — you may be reaching Forgejo JSON when you should only see a Cloudflare Access block page.

**Expected without headers:** HTTP **403** (or **401** if the app uses “Return 401 Response”) — an **Access error page**, **not** Forgejo `/api/v1/version` JSON.

**Fix:** Stop the tunnel. Re-run `bash bridge/write-cloudflared-config.sh` with correct `CF_TEAM_NAME` and 64-char `CF_ACCESS_APPLICATION_AUD`. Restart the user systemd unit. Re-test.

### HTTP 403 **with** correct service token headers

**Meaning:** Token, AUD, or team name mismatch; or stale JWT.

**Checks:**

1. Rotate service token; update Cursor secrets; **start a new agent**.
2. Confirm `audTag` and `teamName` in `config.yml` match the Access application.
3. Restart `cloudflared` after config changes.

### HTTP 401 on git clone/push

**Meaning:** Git `http.extraHeader` misconfiguration.

**Symptoms:** `git config --get-all http.https://git.example.com.extraHeader` shows more than three values, empty lines, or duplicates.

**Fix:** Re-run agent start (runs `agent-git-setup.sh`). It `unset-all` then adds exactly three headers. Locally test:

```bash
bash scripts/test-agent-git-setup-headers.sh
```

**Also check:** pasted secrets with trailing newline (one character longer than expected) — setup script trims, but rotate secrets in Dashboard if unsure.

## Forgejo

### Token scope errors (403 on API)

Regenerate PAT with **repository** and **issue** scopes (read/write as needed).

### Empty repository clone issues

Create the repo with an initial **README** on `main` before first agent clone.

## Cursor Cloud Agent

### `mcp/forgejo-mcp/dist/index.js` missing

**Cause:** `install` in `environment.json` runs only during an **Environment Build**, not on every cold VM. A personal environment with **no successful Build** boots the default image — `install` never ran.

**Fix (in order):**

1. **Dashboard → Environments** → set environment.json location to this repo → **Build** until success ([CURSOR-ENVIRONMENT.md](CURSOR-ENVIRONMENT.md)).
2. This repo **commits** `mcp/forgejo-mcp/dist/`; cloud agents run `scripts/run-forgejo-mcp.sh` via **Custom MCP** (see below), not repo `.cursor/mcp.json`.
3. `start` hook always runs `install-agent-environment.sh`.

### `forgejo_*` tools missing despite `.cursor/mcp.json` in the repo

**Symptoms:** Agent clones this repo and `.cursor/mcp.json` is present on disk, but chat has no `forgejo_*` tools and no MCP approval prompt for forgejo.

**Cause:** Cloud Agents **do not load** repository `.cursor/mcp.json` ([capabilities](https://cursor.com/docs/cloud-agent/capabilities)). That file applies to **Cursor IDE and CLI** only.

**Fix:**

1. Add a personal **Custom MCP** (Command / stdio) per [SETUP.md](SETUP.md) step 11 — `bash` with the documented `-lc` args pointing at `scripts/run-forgejo-mcp.sh`.
2. Do not put secrets in the MCP config; keep `FORGEJO_*` in **Environment secrets** only.
3. Start a **new** cloud agent (running sessions keep the old MCP set).
4. Approve **forgejo** if prompted; confirm `forgejo_*` tools appear.

For local IDE work, `.cursor/mcp.json` in the repo is still correct.

### Forgejo MCP not attached in session (other causes)

1. Complete the Custom MCP step above — `.cursor/mcp.json` alone is not enough on cloud agents.
2. Approve **forgejo** when Cursor prompts for MCP.
3. Ensure Environment secrets are set (`FORGEJO_URL`, `FORGEJO_TOKEN`, …).
4. After MCP code changes, run `bash scripts/sync-forgejo-mcp-dist.sh` and push, or rely on Build/start/wrapper.

### Secrets not updating

Start a **new** cloud agent after changing Dashboard secrets.

## Local tests

```bash
bash scripts/test-agent-git-setup-headers.sh
cd mcp/forgejo-mcp && npm test
scripts/e2e-local-forgejo.sh
```