import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@joshre/beaconed-api-client';
import { registerProductTools } from './products.js';
import { registerOptimizationTools } from './optimizations.js';
import { registerScoreTools } from './scores.js';
import { registerSettingsTools } from './settings.js';
import { registerWebhookTools } from './webhooks.js';

export function registerAllTools(server: McpServer, client: BeaconedClient): void {
  registerProductTools(server, client);
  registerOptimizationTools(server, client);
  registerScoreTools(server, client);
  registerSettingsTools(server, client);
  registerWebhookTools(server, client);
}
