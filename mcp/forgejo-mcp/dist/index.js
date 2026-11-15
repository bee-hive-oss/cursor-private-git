#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ForgejoClient } from "./client.js";
import { loadConfigFromEnv } from "./config.js";
import { registerToolHandlers } from "./tools.js";
async function main() {
    const cfg = loadConfigFromEnv();
    const client = new ForgejoClient(cfg);
    const handlers = registerToolHandlers(client);
    const server = new McpServer({
        name: "forgejo-mcp",
        version: "0.1.0",
    });
    for (const [name, tool] of Object.entries(handlers)) {
        server.registerTool(name, {
            description: `Forgejo: ${name.replace(/^forgejo_/, "").replace(/_/g, " ")}`,
            inputSchema: tool.schema,
        }, async (args) => {
            const parsed = tool.schema.parse(args);
            const result = await tool.run(parsed);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        });
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
