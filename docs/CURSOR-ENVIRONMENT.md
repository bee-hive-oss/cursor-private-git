# Cursor Cloud Agent environment behavior

Official references:

- [Cloud environment setup](https://cursor.com/docs/cloud-agent/setup) — `install`, `start`, `terminals`
- [Cloud Agent Builds](https://cursor.com/docs/cloud-agent/builds) — when `install` runs

## Root cause: cold boot without a Build

The `install` command in `.cursor/environment.json` runs during an **Environment Build**, not on every agent start. Agents boot from the **active Build** (prepared disk snapshot). If no Build has completed, Cursor uses the **default image** and **`start` only** — so `mcp/forgejo-mcp/dist/` was never created.

This repo uses **three layers** so Forgejo MCP works without manual steps:

1. **Committed `mcp/forgejo-mcp/dist/`** — available immediately after git clone (regenerate with `bash scripts/sync-forgejo-mcp-dist.sh` before pushing MCP changes).
2. **`start` hook** — always runs `scripts/install-agent-environment.sh` then git setup.
3. **MCP wrapper** — `scripts/run-forgejo-mcp.sh` builds if `dist/` is still missing when MCP starts.

## Saved environment must point at the repo file

If the environment was created when **main had no** `.cursor/environment.json`, the Dashboard keeps **environment.json location: None** until you change it ([resolution order](https://cursor.com/docs/cloud-agent/setup)).

**Do this in order:**

1. **Merge** `.cursor/environment.json` (and related scripts) to the repository **default branch** first.
2. **Dashboard → Cloud Agents → Environments** → select the environment you use for this repo.
3. Set **environment.json location** to **`.cursor/environment.json`** in this repository.
4. **Build** and wait for success; rebuild after hook or dependency changes.

Until that is done, `install` and `start` from the file **do not run**.

**Manual fallback** on an already-running agent VM:

```bash
bash scripts/agent-environment-start.sh
```

Committed `dist/` and `scripts/run-forgejo-mcp.sh` still help, but Dashboard link + Build is the durable fix.

### Saved environment ignores `environment.json` (Dashboard scripts)

When **environment.json location** stays **None** or hooks never run even after you set the path, configure the environment **directly in the Dashboard**:

| Dashboard field | Value |
|-----------------|--------|
| **Install Script** | `bash scripts/install-agent-environment.sh` |
| **Start Script** | `bash scripts/agent-environment-start.sh` |

Then click **Build** and wait for success. This mirrors `.cursor/environment.json` until the saved environment reliably picks up the repo file ([resolution order](https://cursor.com/docs/cloud-agent/setup)).

## MCP attachment

### `.cursor/mcp.json` — IDE and CLI only

Repo `.cursor/mcp.json` wires `scripts/run-forgejo-mcp.sh` for **local Cursor IDE and CLI**. It is **not** loaded by **Cursor Cloud Agents** ([capabilities](https://cursor.com/docs/cloud-agent/capabilities)).

### Cloud agents — Custom MCP (required)

Cloud agents get MCP from the **MCP dropdown** at [cursor.com/agents](https://cursor.com/agents) (personal Custom MCP) or **Dashboard → Plugins & MCPs** (team admins). Operators must add Forgejo explicitly — see **Step 11** in [SETUP.md](SETUP.md).

Use **Command (stdio)**:

- **command:** `bash`
- **args:** `["-lc", "cd /agent/repos/cursor-private-git 2>/dev/null || cd /workspace 2>/dev/null; exec bash scripts/run-forgejo-mcp.sh"]`

Do **not** embed `FORGEJO_*` in the MCP definition; the child process inherits **Environment secrets** (same names as git setup).

Start a **new** agent after adding or editing the Custom MCP. Running sessions keep their original MCP set.

Approve the **forgejo** server in the agent session if Cursor prompts you.