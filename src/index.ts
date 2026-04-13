import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createConfiguredMcpServer } from "./mcp-server.js";

async function main(): Promise<void> {
  const server = await createConfiguredMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
