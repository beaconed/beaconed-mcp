import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@beaconed/api-client';
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

const statusEnum = z.enum(['active', 'draft', 'archived']);

const imageSchema = z.object({
  id: z.string().optional().describe('Image UUID'),
  src: z.string().optional().describe('Image source URL'),
  altText: z.string().optional().describe('Alt text for the image'),
  width: z.number().int().optional().describe('Image width in pixels'),
  height: z.number().int().optional().describe('Image height in pixels'),
});

const productInputSchema = {
  title: z.string().optional().describe('Product title'),
  description: z.string().optional().describe('Product description (HTML)'),
  handle: z.string().optional().describe('URL-friendly product handle'),
  status: statusEnum.optional().describe('Product status'),
  vendor: z.string().optional().describe('Vendor / brand name'),
  product_type: z.string().optional().describe('Product type / category'),
  meta_title: z.string().optional().describe('SEO meta title'),
  meta_description: z.string().optional().describe('SEO meta description'),
  og_title: z.string().optional().describe('Open Graph title for social media'),
  og_description: z.string().optional().describe('Open Graph description for social media'),
  tags: z.string().optional().describe('Comma-separated product tags'),
  external_id: z.string().optional().describe('Your system product ID — used for idempotency on create'),
  images: z.array(imageSchema).optional().describe('Product images'),
};

export function registerProductMutationTools(server: McpServer, client: BeaconedClient): void {
  // beaconed_products_create
  server.tool(
    'beaconed_products_create',
    'POST /api/v1/products — create a product from external (non-Shopify) data. Use external_id for idempotency.',
    productInputSchema,
    { destructiveHint: false, idempotentHint: false },
    async (params) => {
      try {
        const result = await client.products.create(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_products_create');
      }
    },
  );

  // beaconed_products_update
  server.tool(
    'beaconed_products_update',
    'PATCH /api/v1/products/{id} — update a product\'s fields. Only include fields you want to change.',
    {
      id: z.string().describe('Product UUID'),
      ...productInputSchema,
    },
    { destructiveHint: false, idempotentHint: true },
    async ({ id, ...input }) => {
      try {
        const result = await client.products.update(id, input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_products_update');
      }
    },
  );

  // beaconed_products_sync
  server.tool(
    'beaconed_products_sync',
    'POST /api/v1/products/{id}/sync — trigger a Shopify sync for the product (queued, 202). EXPENSIVE: 10 req/min limit.',
    {
      id: z.string().describe('Product UUID'),
    },
    { destructiveHint: false, idempotentHint: true },
    async ({ id }) => {
      try {
        const result = await client.products.sync(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_products_sync');
      }
    },
  );

  // beaconed_products_optimize
  server.tool(
    'beaconed_products_optimize',
    'POST /api/v1/products/{id}/optimization — queue AI optimization for one or more product fields (queued, 202). EXPENSIVE: 10 req/min limit.',
    {
      id: z.string().describe('Product UUID'),
      fields: z
        .array(fieldEnum)
        .optional()
        .describe('Fields to optimize. Omit to optimize all default fields.'),
    },
    { destructiveHint: false, idempotentHint: false },
    async ({ id, fields }) => {
      try {
        const input = fields !== undefined ? { fields } : undefined;
        const result = await client.products.optimize(id, input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_products_optimize');
      }
    },
  );

  // beaconed_products_calculate_score
  server.tool(
    'beaconed_products_calculate_score',
    'POST /api/v1/products/{id}/scores/calculation — recalculate the readiness score for a product. EXPENSIVE: 10 req/min limit.',
    {
      id: z.string().describe('Product UUID'),
    },
    { destructiveHint: false, idempotentHint: true },
    async ({ id }) => {
      try {
        const result = await client.products.calculateScore(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_products_calculate_score');
      }
    },
  );
}
