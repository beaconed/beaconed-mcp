import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BeaconedClient } from '@beaconed/api-client';
import { formatError } from '../error-utils.js';

const paginationSchema = {
  page: z.number().int().positive().optional().describe('Page number (1-based)'),
  per_page: z.number().int().min(1).max(100).optional().describe('Items per page (max 100)'),
};

const scoreFilters = {
  ...paginationSchema,
  since: z.string().optional().describe('ISO 8601 date — only scores on or after this date'),
  until: z.string().optional().describe('ISO 8601 date — only scores on or before this date'),
  grade: z
    .string()
    .optional()
    .describe('Filter by grade (excellent, good, fair, poor, critical)'),
};

export function registerScoreTools(server: McpServer, client: BeaconedClient): void {
  // beaconed_scores_list
  server.tool(
    'beaconed_scores_list',
    'GET /api/v1/scores — list readiness scores across all products (SPEC-ABSENT endpoint; verify availability with API team)',
    scoreFilters,
    async (params) => {
      try {
        const result = await client.scores.list(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_scores_list');
      }
    },
  );

  // beaconed_scores_latest
  server.tool(
    'beaconed_scores_latest',
    'GET /api/v1/scores/latest — fetch the latest score for each product (SPEC-ABSENT endpoint; verify availability with API team)',
    scoreFilters,
    async (params) => {
      try {
        const result = await client.scores.latest(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return formatError(err, 'beaconed_scores_latest');
      }
    },
  );
}
