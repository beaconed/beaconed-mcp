import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@joshre/beaconed-api-client';

const MIME_TYPE = 'application/json';

export function registerProductResources(server: McpServer, client: BeaconedClient): void {
  // beaconed://products — list resource (first page, 20 per page)
  server.resource(
    'beaconed-products-list',
    'beaconed://products',
    { mimeType: MIME_TYPE, description: 'Paginated list of Beaconed products (first page, 20 per page)' },
    async () => {
      const result = await client.products.list({ per_page: 20 });
      return {
        contents: [
          {
            uri: 'beaconed://products',
            mimeType: MIME_TYPE,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // beaconed://products/{id} — individual product detail
  const productTemplate = new ResourceTemplate('beaconed://products/{id}', { list: undefined });

  server.resource(
    'beaconed-product-detail',
    productTemplate,
    { mimeType: MIME_TYPE, description: 'Full detail for a single Beaconed product by UUID' },
    async (uri, { id }) => {
      const productId = Array.isArray(id) ? id[0] : id;
      const product = await client.products.get(productId ?? '');
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: MIME_TYPE,
            text: JSON.stringify(product, null, 2),
          },
        ],
      };
    },
  );
}
