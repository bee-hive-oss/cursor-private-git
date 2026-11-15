# Agent instructions (cursor-private-git)

## Source of truth

- **Canonical code and history** live on **private Forgejo**, not this GitHub repository.
- GitHub (`Zakox/cursor-private-git`) is a **launch placeholder** only (clone target for Cursor until native self-hosted git exists).
- Push feature branches to **Forgejo** with `git push forgejo` (or `origin` after `scripts/agent-git-setup.sh`).
- Open and manage **pull requests on Forgejo** using the **`forgejo` MCP server** (`mcp/forgejo-mcp`).

## Never

- Do not push application code to GitHub except docs/plumbing for the placeholder itself.
- Do not print or commit secrets; use Cursor environment secrets (see `docs/SETUP.md` and `docs/SETUP-CHECKLIST.md`).
- Do not add `.github/workflows` or GitHub Actions.
- Do not use `sudo`, Docker, `--no-verify`, or force-push.

## Environment

`.cursor/environment.json` hooks:

1. **install** → runs on **Environment Builds only** ([docs/CURSOR-ENVIRONMENT.md](docs/CURSOR-ENVIRONMENT.md)) — `scripts/install-agent-environment.sh`.
2. **start** → always runs install script, then `scripts/agent-git-setup.sh`.
3. **MCP (IDE/CLI)** → `.cursor/mcp.json` uses `scripts/run-forgejo-mcp.sh` (builds if needed). **Cloud agents do not read this file** — see MCP enablement below.
4. Committed `mcp/forgejo-mcp/dist/` covers cold boots without a Build.

`agent-git-setup` configures git idempotently: exactly three `http.extraHeader` values for the Forgejo URL (Cloudflare Access client id/secret + Forgejo token), with secrets trimmed. Re-running start must not duplicate headers.

## MCP enablement (operator + agent)

**Cloud agents** do not load repo `.cursor/mcp.json` ([cloud agent capabilities](https://cursor.com/docs/cloud-agent/capabilities)). MCP comes from the agent MCP dropdown or **Dashboard → Plugins & MCPs** (team admins).

1. **Dashboard → Environments** → environment.json location = this repo → **Build** successfully (once, and again after dependency changes). If hooks never run, set **Install Script** / **Start Script** manually per [docs/CURSOR-ENVIRONMENT.md](docs/CURSOR-ENVIRONMENT.md), then **Build**.
2. Add a **Custom MCP** (stdio): `bash` with args `["-lc", "cd /agent/repos/cursor-private-git 2>/dev/null || cd /workspace 2>/dev/null; exec bash scripts/run-forgejo-mcp.sh"]` — full steps in [docs/SETUP.md](docs/SETUP.md) step 11. No env vars in MCP config (`FORGEJO_*` from Cursor Secrets).
3. Set Environment secrets: `FORGEJO_URL`, `FORGEJO_TOKEN`, `FORGEJO_CF_ACCESS_CLIENT_ID`, `FORGEJO_CF_ACCESS_CLIENT_SECRET`, `FORGEJO_REPO_OWNER`, `FORGEJO_REPO_NAME`.
4. Start a **new** agent after adding MCP (running sessions keep the old MCP set).
5. Approve the **forgejo** MCP in the agent session when prompted.
6. Keep `.cursor/mcp.json` for **IDE/CLI**; do not put secrets in MCP JSON.

Use Forgejo tools (`forgejo_*`) for issues, PRs, labels, branches, file reads, and commit statuses — not GitHub MCP for product work.

## Commit identity

Use the project-defined git user for commits on this plumbing repo: `Zakox <33333831+Zakox@users.noreply.github.com>`.