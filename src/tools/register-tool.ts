import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { McpServer, ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShape } from 'zod';

const TOOL_TITLES: Record<string, string> = {
  beaconed_bulk_optimize: 'Create Bulk Optimizations',
  beaconed_optimizations_approve: 'Approve Optimization',
  beaconed_optimizations_apply: 'Apply Optimization',
  beaconed_optimizations_reject: 'Reject Optimization',
  beaconed_optimizations_revert: 'Revert Optimization',
  beaconed_optimizations_get: 'Get Optimization',
  beaconed_optimizations_list: 'List Optimizations',
  beaconed_products_create: 'Create Product',
  beaconed_products_calculate_score: 'Calculate Product Score',
  beaconed_products_optimize: 'Optimize Product',
  beaconed_products_sync: 'Sync Product',
  beaconed_products_update: 'Update Product',
  beaconed_products_get: 'Get Product',
  beaconed_products_list: 'List Products',
  beaconed_products_optimizations: 'Get Product Optimizations',
  beaconed_products_scores: 'Get Product Scores',
  beaconed_scores_latest: 'Get Latest Scores',
  beaconed_scores_list: 'List Scores',
  beaconed_settings_get: 'Get Settings',
  beaconed_webhooks_create: 'Create Webhook',
  beaconed_webhooks_delete: 'Delete Webhook',
  beaconed_webhooks_update: 'Update Webhook',
  beaconed_webhooks_test: 'Test Webhook',
  beaconed_webhooks_get: 'Get Webhook',
  beaconed_webhooks_list: 'List Webhooks',
  beaconed_webhooks_events: 'List Webhook Events',
};

export function registerTool<Args extends ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  inputSchema: Args,
  annotations: ToolAnnotations,
  callback: ToolCallback<Args>,
): void {
  const title = TOOL_TITLES[name];
  if (!title) throw new Error(`Missing human-readable title for tool ${name}`);
  server.registerTool(name, { title, description, inputSchema, annotations }, callback);
}
