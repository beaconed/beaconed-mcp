import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@beaconed/api-client';
import { registerProductResources } from './products.js';
import { registerOptimizationResources } from './optimizations.js';

export function registerAllResources(server: McpServer, client: BeaconedClient): void {
  registerProductResources(server, client);
  registerOptimizationResources(server, client);
}
