#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// zod is used for tool input schemas in M2+; import is deferred until then.

const SERVER_NAME = 'beaconed-mcp';
const SERVER_VERSION = '0.0.1';

export function createServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Placeholder tool — proves the transport wiring. Real tools land in M2.
  server.tool('beaconed_health', 'Returns ok: true to confirm the server is running.', {}, async () => {
    return {
      content: [{ type: 'text', text: JSON.stringify({ ok: true }) }],
    };
  });

  return server;
}

// Only run the stdio transport when executed directly (not imported by tests).
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const apiKey = process.env['BEACONED_API_KEY'];
  if (!apiKey) {
    process.stderr.write('BEACONED_API_KEY environment variable is required\n');
    process.exit(1);
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err: unknown) => {
    process.stderr.write(`Failed to start server: ${String(err)}\n`);
    process.exit(1);
  });
}
