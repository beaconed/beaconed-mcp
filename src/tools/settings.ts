import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@beaconed/api-client';
import { formatError } from '../error-utils.js';
import { registerTool } from './register-tool.js';

export function registerSettingsTools(server: McpServer, client: BeaconedClient): void {
  // beaconed_settings_get
  registerTool(
    server,
    'beaconed_settings_get',
    'GET /api/v1/settings — fetch the account optimization settings including brand voice, required/excluded keywords, and auto-push configuration',
    {},
    { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    async () => {
      try {
        const settings = await client.settings.get();
        return { content: [{ type: 'text', text: JSON.stringify(settings, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_settings_get');
      }
    },
  );
}
