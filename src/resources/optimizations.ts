import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@joshre/beaconed-api-client';

const MIME_TYPE = 'application/json';

export function registerOptimizationResources(server: McpServer, client: BeaconedClient): void {
  // beaconed://optimizations — list resource (first page, 20 per page)
  server.resource(
    'beaconed-optimizations-list',
    'beaconed://optimizations',
    { mimeType: MIME_TYPE, description: 'Paginated list of Beaconed optimizations (first page, 20 per page)' },
    async () => {
      const result = await client.optimizations.list({ per_page: 20 });
      return {
        contents: [
          {
            uri: 'beaconed://optimizations',
            mimeType: MIME_TYPE,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // beaconed://optimizations/{id} — individual optimization detail
  const optimizationTemplate = new ResourceTemplate('beaconed://optimizations/{id}', { list: undefined });

  server.resource(
    'beaconed-optimization-detail',
    optimizationTemplate,
    { mimeType: MIME_TYPE, description: 'Full detail for a single Beaconed optimization by UUID' },
    async (uri, { id }) => {
      const optimizationId = Array.isArray(id) ? id[0] : id;
      const optimization = await client.optimizations.get(optimizationId ?? '');
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: MIME_TYPE,
            text: JSON.stringify(optimization, null, 2),
          },
        ],
      };
    },
  );
}
