# Implementation plan

## Scope

Six Lego blocks in one GitHub placeholder repo; real git lives on private Forgejo.

| Block | Path | Status |
|-------|------|--------|
| Network bridge | `bridge/` | Implemented |
| Agent git setup | `scripts/`, `.cursor/environment.json` | Implemented |
| Forgejo MCP | `mcp/forgejo-mcp/` | Custom TS server (see `docs/mcp-evaluation.md`) |
| Agent rules | `AGENTS.md`, `.cursor/rules/` | Implemented |
| Forum README | `README.md` | Implemented |
| Tests | `mcp/forgejo-mcp/tests/`, `scripts/e2e-local-forgejo.sh` | Implemented |

## MCP decision

Existing Forgejo MCPs (Go/Docker-heavy or huge surface) do not match our constraints: no Docker, small auditable surface, mock-friendly unit tests, Cursor `.cursor/mcp.json` wiring. We ship `mcp/forgejo-mcp` focused on agent PR/issue workflows.

## Test strategy

1. **Unit**: Vitest + mocked `fetch` against Forgejo API shapes.
2. **E2e**: `scripts/e2e-local-forgejo.sh` uses `config/forgejo.env` (default **17.0.1**), installs throwaway Forgejo, clone/push, and `npm run test:integration` — no root/Docker.

## Git author

All commits: `Zakox <33333831+Zakox@users.noreply.github.com>`.