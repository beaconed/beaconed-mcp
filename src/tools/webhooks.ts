import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@beaconed/api-client';
import { formatError } from '../error-utils.js';

const paginationSchema = {
  page: z.number().int().positive().optional().describe('Page number (1-based)'),
  per_page: z.number().int().min(1).max(100).optional().describe('Items per page (max 100)'),
};

export function registerWebhookTools(server: McpServer, client: BeaconedClient): void {
  // beaconed_webhooks_list
  server.tool(
    'beaconed_webhooks_list',
    'GET /api/v1/webhooks — list webhook subscriptions registered for the current API key',
    paginationSchema,
    async (params) => {
      try {
        const result = await client.webhooks.list(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_webhooks_list');
      }
    },
  );

  // beaconed_webhooks_get
  server.tool(
    'beaconed_webhooks_get',
    'GET /api/v1/webhooks/{id} — fetch details about a specific webhook subscription including last error info',
    {
      id: z.string().describe('Webhook UUID'),
    },
    async ({ id }) => {
      try {
        const webhook = await client.webhooks.get(id);
        return { content: [{ type: 'text', text: JSON.stringify(webhook, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_webhooks_get');
      }
    },
  );

  // beaconed_webhooks_events
  server.tool(
    'beaconed_webhooks_events',
    'GET /api/v1/webhooks/events — fetch the global catalog of all available webhook event types',
    paginationSchema,
    async (params) => {
      try {
        const result = await client.webhooks.events(undefined, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_webhooks_events');
      }
    },
  );
}
