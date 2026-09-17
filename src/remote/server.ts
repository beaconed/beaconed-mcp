import { BeaconedClient } from '@beaconed/api-client';
import { createServer } from '../server.js';
import { readConfig } from './config.js';
import { startRemote } from './runtime.js';

export const readTools = new Set([
  'beaconed_products_list',
  'beaconed_products_get',
  'beaconed_products_scores',
  'beaconed_products_optimizations',
  'beaconed_optimizations_list',
  'beaconed_optimizations_get',
  'beaconed_scores_list',
  'beaconed_scores_latest',
  'beaconed_settings_get',
  'beaconed_webhooks_list',
  'beaconed_webhooks_get',
  'beaconed_webhooks_events',
]);

const config = readConfig();
await startRemote({
  readTools,
  create: (apiKey) =>
    createServer(
      new BeaconedClient({
        apiKey,
        baseUrl: config.productOrigin,
        userAgent: 'beaconed-mcp/0.0.4',
        clientId: 'beaconed-mcp',
      }),
    ),
});

