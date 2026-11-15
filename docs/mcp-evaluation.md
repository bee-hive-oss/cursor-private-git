# Forgejo MCP landscape (honest evaluation)

For Cursor cloud agents we need: stdio MCP, no Docker/root, env-based secrets, PR/issue tools agents use daily, unit tests with mocks.

| Project | Pros | Cons for this repo |
|---------|------|---------------------|
| [goern/forgejo-mcp](https://codeberg.org/goern/forgejo-mcp) | Mature, HTTP+stdio | Go toolchain; large moving target |
| [raohwork/forgejo-mcp](https://github.com/raohwork/forgejo-mcp) | Broad features | Docker recommended; Go install |
| [@ric_/forgejo-mcp](https://www.npmjs.com/package/@ric_/forgejo-mcp) | npm, 457 tools | Heavy; not tailored to agent gates |
| [teran/mcp-forgejo](https://github.com/teran/mcp-forgejo) | 52 focused tools | Separate adoption path; less control over Cursor wiring |
| [DarkEngineer/mcp-forgejo-server](https://github.com/DarkEngineer/mcp-forgejo-server) | .NET, tested | Requires .NET runtime |

**Conclusion:** Reference these in production if you want full API coverage. For `cursor-private-git`, we implement **`mcp/forgejo-mcp`** — TypeScript, `@modelcontextprotocol/sdk`, explicit tool list matching agent instructions, Vitest mocks, no extra runtimes.