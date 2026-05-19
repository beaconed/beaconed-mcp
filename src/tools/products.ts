import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@beaconed/api-client';
import { BeaconedError } from '@beaconed/api-client';
import { formatError } from '../error-utils.js';

const statusSchema = z.enum(['active', 'draft', 'archived']).optional();
const gradeSchema = z.enum(['excellent', 'good', 'fair', 'poor', 'critical']).optional();
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
  .optional();
const paginationSchema = {
  page: z.number().int().positive().optional().describe('Page number (1-based)'),
  per_page: z.number().int().min(1).max(100).optional().describe('Items per page (max 100)'),
};

export function registerProductTools(server: McpServer, client: BeaconedClient): void {
  // beaconed_products_list
  server.tool(
    'beaconed_products_list',
    'GET /api/v1/products — list products with optional filters for status, score, grade, and search query',
    {
      ...paginationSchema,
      status: statusSchema.describe('Filter by Shopify product status'),
      min_score: z.number().min(0).max(100).optional().describe('Minimum readiness score (0-100)'),
      max_score: z.number().min(0).max(100).optional().describe('Maximum readiness score (0-100)'),
      grade: gradeSchema.describe('Filter by readiness grade'),
      needs_optimization: z.boolean().optional().describe('Only return products with pending optimizations'),
      q: z.string().optional().describe('Search by product title'),
    },
    async (params) => {
      try {
        const result = await client.products.list(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_products_list');
      }
    },
  );

  // beaconed_products_get
  server.tool(
    'beaconed_products_get',
    'GET /api/v1/products/{id} — fetch full product detail including images, score history, and latest optimization',
    {
      id: z.string().describe('Product UUID'),
    },
    async ({ id }) => {
      try {
        const product = await client.products.get(id);
        return { content: [{ type: 'text', text: JSON.stringify(product, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_products_get');
      }
    },
  );

  // beaconed_products_scores
  server.tool(
    'beaconed_products_scores',
    'GET /api/v1/products/{id}/scores — fetch score history for a specific product',
    {
      id: z.string().describe('Product UUID'),
      ...paginationSchema,
      since: z.string().optional().describe('ISO 8601 date — only scores on or after this date'),
      until: z.string().optional().describe('ISO 8601 date — only scores on or before this date'),
      grade: z.string().optional().describe('Filter by grade (excellent, good, fair, poor, critical)'),
    },
    async ({ id, ...params }) => {
      try {
        const result = await client.products.scores(id, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_products_scores');
      }
    },
  );

  // beaconed_products_optimizations
  server.tool(
    'beaconed_products_optimizations',
    'GET /api/v1/optimizations?product_id={id} — list optimizations for a specific product',
    {
      id: z.string().describe('Product UUID'),
      ...paginationSchema,
      status: z
        .enum(['pending', 'approved', 'rejected', 'applied', 'reverted'])
        .optional()
        .describe('Filter by optimization status'),
      field: fieldSchema.describe('Filter by the product field being optimized'),
    },
    async ({ id, ...params }) => {
      try {
        const result = await client.products.optimizations(id, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        if (err instanceof BeaconedError) {
          return formatError(err, 'beaconed_products_optimizations');
        }
        return formatError(err, 'beaconed_products_optimizations');
      }
    },
  );
}
