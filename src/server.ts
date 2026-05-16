#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BeaconedClient } from '@joshre/beaconed-api-client';
import { registerAllTools } from './tools/index.js';
import { registerAllResources } from './resources/index.js';

const SERVER_NAME = 'beaconed-mcp';
const SERVER_VERSION = '0.0.1';

export function createServer(client: BeaconedClient): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  registerAllTools(server, client);
  registerAllResources(server, client);

  return server;
}

// Only run the stdio transport when executed directly (not imported by tests).
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const apiKey = process.env['BEACONED_API_KEY'];
  if (!apiKey) {
    process.stderr.write('BEACONED_API_KEY environment variable is required\n');
    process.exit(2);
  }

  const client = new BeaconedClient({
    apiKey,
    baseUrl: process.env['BEACONED_BASE_URL'] ?? 'https://beaconed.ai',
    userAgent: 'beaconed-mcp/0.0.1',
  });

  const server = createServer(client);
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err: unknown) => {
    process.stderr.write(`Failed to start server: ${String(err)}\n`);
    process.exit(1);
  });
}
