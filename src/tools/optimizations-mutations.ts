import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@beaconed/api-client';
import { formatError } from '../error-utils.js';

export function registerOptimizationMutationTools(server: McpServer, client: BeaconedClient): void {
  // beaconed_optimizations_approve
  server.tool(
    'beaconed_optimizations_approve',
    'POST /api/v1/optimizations/{id}/approval — approve a pending optimization; can publish live product content when auto_push_on_approve is enabled. Inspect settings and the proposed changes first. Rate limit: 10 requests/min.',
    {
      id: z.string().describe('Optimization UUID'),
    },
    { readOnlyHint: false, openWorldHint: true, destructiveHint: true, idempotentHint: true },
    async ({ id }) => {
      try {
        const result = await client.optimizations.approve(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_optimizations_approve');
      }
    },
  );

  // beaconed_optimizations_reject
  server.tool(
    'beaconed_optimizations_reject',
    'POST /api/v1/optimizations/{id}/rejection — reject a pending optimization with an optional reason.',
    {
      id: z.string().describe('Optimization UUID'),
      reason: z.string().optional().describe('Optional reason for rejection'),
    },
    { readOnlyHint: false, openWorldHint: true, destructiveHint: false, idempotentHint: true },
    async ({ id, reason }) => {
      try {
        const input = reason !== undefined ? { reason } : undefined;
        const result = await client.optimizations.reject(id, input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_optimizations_reject');
      }
    },
  );

  // beaconed_optimizations_apply
  server.tool(
    'beaconed_optimizations_apply',
    'POST /api/v1/optimizations/{id}/application — requests application of an approved optimization to the live product. Shopify writes are queued; read optimization detail to confirm completion. DESTRUCTIVE: changes the product\'s public-facing copy. Rate limit: 10 requests/min.',
    {
      id: z.string().describe('Optimization UUID'),
    },
    { readOnlyHint: false, openWorldHint: true, destructiveHint: true, idempotentHint: false },
    async ({ id }) => {
      try {
        const result = await client.optimizations.apply(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_optimizations_apply');
      }
    },
  );

  // beaconed_optimizations_revert
  server.tool(
    'beaconed_optimizations_revert',
    'POST /api/v1/optimizations/{id}/reversion — requests reversion to the original content. Shopify writes are queued; read optimization detail to confirm completion. DESTRUCTIVE: overwrites the product\'s current copy. Rate limit: 10 requests/min.',
    {
      id: z.string().describe('Optimization UUID'),
    },
    { readOnlyHint: false, openWorldHint: true, destructiveHint: true, idempotentHint: false },
    async ({ id }) => {
      try {
        const result = await client.optimizations.revert(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_optimizations_revert');
      }
    },
  );
}
