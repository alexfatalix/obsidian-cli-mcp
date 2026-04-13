import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type CommandResult, runObsidian } from "./obsidian-cli.js";
import { buildCliArgs, getToolSpecs, type ToolSpec } from "./tool-specs.js";

function buildToolResult(result: CommandResult) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

function createMcpServer(toolSpecs: ToolSpec[]): McpServer {
  const server = new McpServer({
    name: "obsidian-cli-mcp",
    version: "0.1.0",
  });

  for (const spec of toolSpecs) {
    server.registerTool(
      spec.name,
      {
        description: spec.description,
        inputSchema: spec.inputSchema,
      },
      async (args) => {
        const result = await runObsidian(
          buildCliArgs(spec, args as Record<string, unknown>),
        );

        return buildToolResult(result);
      },
    );
  }

  return server;
}

export async function createConfiguredMcpServer(): Promise<McpServer> {
  const toolSpecs = await getToolSpecs();
  return createMcpServer(toolSpecs);
}
