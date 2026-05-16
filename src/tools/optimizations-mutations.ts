import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@joshre/beaconed-api-client';
import { formatError } from '../error-utils.js';

export function registerOptimizationMutationTools(server: McpServer, client: BeaconedClient): void {
  // beaconed_optimizations_approve
  server.tool(
    'beaconed_optimizations_approve',
    'POST /api/v1/optimizations/{id}/approval — approve a pending optimization, marking it ready to apply. EXPENSIVE: 10 req/min limit.',
    {
      id: z.string().describe('Optimization UUID'),
    },
    { destructiveHint: false, idempotentHint: true },
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
    { destructiveHint: false, idempotentHint: true },
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
    'POST /api/v1/optimizations/{id}/application — applies an approved optimization to the live product. DESTRUCTIVE: changes the product\'s public-facing copy. EXPENSIVE: 10 req/min limit.',
    {
      id: z.string().describe('Optimization UUID'),
    },
    { destructiveHint: true, idempotentHint: false },
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
    'POST /api/v1/optimizations/{id}/reversion — reverts an applied optimization back to the original content. DESTRUCTIVE: overwrites the product\'s current copy. EXPENSIVE: 10 req/min limit.',
    {
      id: z.string().describe('Optimization UUID'),
    },
    { destructiveHint: true, idempotentHint: false },
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
