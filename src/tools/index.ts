import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@joshre/beaconed-api-client';
import { registerProductTools } from './products.js';
import { registerOptimizationTools } from './optimizations.js';
import { registerScoreTools } from './scores.js';
import { registerSettingsTools } from './settings.js';
import { registerWebhookTools } from './webhooks.js';
import { registerProductMutationTools } from './products-mutations.js';
import { registerOptimizationMutationTools } from './optimizations-mutations.js';
import { registerWebhookMutationTools } from './webhooks-mutations.js';

export function registerAllTools(server: McpServer, client: BeaconedClient): void {
  // Read tools
  registerProductTools(server, client);
  registerOptimizationTools(server, client);
  registerScoreTools(server, client);
  registerSettingsTools(server, client);
  registerWebhookTools(server, client);
  // Mutation tools
  registerProductMutationTools(server, client);
  registerOptimizationMutationTools(server, client);
  registerWebhookMutationTools(server, client);
}
