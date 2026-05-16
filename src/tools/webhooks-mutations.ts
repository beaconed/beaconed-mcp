import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@joshre/beaconed-api-client';
import { formatError } from '../error-utils.js';

const webhookEventEnum = z.enum([
  'optimization.created',
  'optimization.approved',
  'optimization.rejected',
  'optimization.applied',
  'optimization.reverted',
  'product.scored',
  'product.synced',
]);

export function registerWebhookMutationTools(server: McpServer, client: BeaconedClient): void {
  // beaconed_webhooks_create
  server.tool(
    'beaconed_webhooks_create',
    'POST /api/v1/webhooks — create a new webhook subscription. The signing secret is returned only once — store it securely.',
    {
      url: z.string().url().describe('HTTPS URL to receive webhook deliveries'),
      events: z.array(webhookEventEnum).min(1).describe('Events to subscribe to'),
    },
    { destructiveHint: false, idempotentHint: false },
    async ({ url, events }) => {
      try {
        const result = await client.webhooks.create({ url, events });
        return {
          content: [
            {
              type: 'text',
              text: `Webhook created. SECRET is shown only once — store it.\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (err) {
        return formatError(err, 'beaconed_webhooks_create');
      }
    },
  );

  // beaconed_webhooks_update
  server.tool(
    'beaconed_webhooks_update',
    'PATCH /api/v1/webhooks/{id} — update a webhook subscription\'s URL, events, or status.',
    {
      id: z.string().describe('Webhook UUID'),
      url: z.string().url().optional().describe('New HTTPS delivery URL'),
      events: z.array(z.string()).optional().describe('New list of subscribed events'),
      status: z.enum(['active', 'paused']).optional().describe('Set to paused to temporarily disable deliveries'),
    },
    { destructiveHint: false, idempotentHint: true },
    async ({ id, ...input }) => {
      try {
        const result = await client.webhooks.update(id, input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_webhooks_update');
      }
    },
  );

  // beaconed_webhooks_delete
  server.tool(
    'beaconed_webhooks_delete',
    'DELETE /api/v1/webhooks/{id} — permanently remove a webhook subscription. DESTRUCTIVE: webhook deliveries stop immediately.',
    {
      id: z.string().describe('Webhook UUID'),
    },
    { destructiveHint: true, idempotentHint: true },
    async ({ id }) => {
      try {
        await client.webhooks.delete(id);
        return { content: [{ type: 'text', text: `Webhook ${id} deleted.` }] };
      } catch (err) {
        return formatError(err, 'beaconed_webhooks_delete');
      }
    },
  );

  // beaconed_webhooks_test
  server.tool(
    'beaconed_webhooks_test',
    'POST /api/v1/webhooks/{id}/test — send a test event to a webhook to verify delivery is working.',
    {
      id: z.string().describe('Webhook UUID'),
    },
    { destructiveHint: false, idempotentHint: false },
    async ({ id }) => {
      try {
        const result = await client.webhooks.test(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_webhooks_test');
      }
    },
  );
}
