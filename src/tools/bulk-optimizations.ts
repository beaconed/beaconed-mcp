import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@joshre/beaconed-api-client';
import { formatError } from '../error-utils.js';

const fieldEnum = z.enum([
  'title',
  'description',
  'alt_text',
  'meta_title',
  'meta_description',
  'tags',
  'product_type',
  'og_title',
  'og_description',
]);

export function registerBulkOptimizationTools(server: McpServer, client: BeaconedClient): void {
  // beaconed_bulk_optimize
  server.tool(
    'beaconed_bulk_optimize',
    'POST /api/v1/bulk_optimizations — queue AI optimization for multiple products in one request (queued, 202). EXPENSIVE: 10 req/min limit.',
    {
      product_ids: z
        .array(z.string())
        .min(1)
        .describe('Array of product UUIDs to optimize. Must be non-empty.'),
      fields: z
        .array(fieldEnum)
        .optional()
        .describe('Fields to optimize. Omit to optimize all default fields.'),
    },
    { destructiveHint: false, idempotentHint: false },
    async ({ product_ids, fields }) => {
      try {
        const input = fields !== undefined ? { product_ids, fields } : { product_ids };
        const result = await client.bulkOptimizations.create(input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_bulk_optimize');
      }
    },
  );
}
