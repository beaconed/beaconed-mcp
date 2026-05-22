import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@beaconed/api-client';
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
