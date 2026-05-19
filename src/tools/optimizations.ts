import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@beaconed/api-client';
import { formatError } from '../error-utils.js';

const paginationSchema = {
  page: z.number().int().positive().optional().describe('Page number (1-based)'),
  per_page: z.number().int().min(1).max(100).optional().describe('Items per page (max 100)'),
};

const statusSchema = z
  .enum(['pending', 'approved', 'rejected', 'applied', 'reverted'])
  .optional()
  .describe('Filter by optimization status');

const fieldSchema = z
  .enum([
    'title',
    'description',
    'alt_text',
    'meta_title',
    'meta_description',
    'tags',
    'product_type',
    'og_title',
    'og_description',
  ])
  .optional()
  .describe('Filter by the product field being optimized');

export function registerOptimizationTools(server: McpServer, client: BeaconedClient): void {
  // beaconed_optimizations_list
  server.tool(
    'beaconed_optimizations_list',
    'GET /api/v1/optimizations — list AI-generated optimizations with optional filters for status, field, product, and date',
    {
      ...paginationSchema,
      status: statusSchema,
      field: fieldSchema,
      product_id: z.string().optional().describe('Filter to a specific product UUID'),
      since: z.string().optional().describe('ISO 8601 date — only optimizations created on or after this date'),
    },
    async (params) => {
      try {
        const result = await client.optimizations.list(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_optimizations_list');
      }
    },
  );

  // beaconed_optimizations_get
  server.tool(
    'beaconed_optimizations_get',
    'GET /api/v1/optimizations/{id} — fetch full optimization detail including original and optimized content',
    {
      id: z.string().describe('Optimization UUID'),
    },
    async ({ id }) => {
      try {
        const optimization = await client.optimizations.get(id);
        return { content: [{ type: 'text', text: JSON.stringify(optimization, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_optimizations_get');
      }
    },
  );
}
