import { describe, it, expect, vi } from 'vitest';
import { BeaconedClient } from '@beaconed/api-client';
import {
  BeaconedNotFoundError,
  BeaconedAuthError,
  BeaconedRateLimitError,
} from '@beaconed/api-client';
import { createServer } from '../src/server.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClient(overrides: Partial<BeaconedClient> = {}): BeaconedClient {
  return {
    apiKey: 'test-key',
    baseUrl: 'https://beaconed.ai',
    userAgent: 'test',
    products: {
      list: vi.fn(),
      get: vi.fn(),
      scores: vi.fn(),
      optimizations: vi.fn(),
      listAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      sync: vi.fn(),
      optimize: vi.fn(),
      calculateScore: vi.fn(),
    },
    optimizations: {
      list: vi.fn(),
      get: vi.fn(),
      listAll: vi.fn(),
      approve: vi.fn(),
      reject: vi.fn(),
      apply: vi.fn(),
      revert: vi.fn(),
    },
    scores: {
      list: vi.fn(),
      latest: vi.fn(),
      listByProduct: vi.fn(),
      latestByProduct: vi.fn(),
      listAll: vi.fn(),
      listAllByProduct: vi.fn(),
    },
    settings: {
      get: vi.fn(),
    },
    webhooks: {
      list: vi.fn(),
      get: vi.fn(),
      events: vi.fn(),
      listAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      test: vi.fn(),
    },
    ...overrides,
  } as unknown as BeaconedClient;
}

/**
 * Minimal CallTool dispatcher — finds the registered tool by name and calls its
 * handler. We rely on the fact that McpServer stores _registeredTools as a plain
 * record keyed by tool name (per SDK source at server/mcp.js).
 */
async function callTool(
  server: ReturnType<typeof createServer>,
  name: string,
  args: Record<string, unknown> = {},
) {
  // Access the internal map — acceptable for test-harness use.
  const tools = (server as unknown as { _registeredTools: Record<string, { handler: (args: Record<string, unknown>) => Promise<unknown> }> })._registeredTools;
  const tool = tools[name];
  if (!tool) throw new Error(`Tool "${name}" not registered`);
  return tool.handler(args);
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const PRODUCT_LIST_RESPONSE = {
  data: [{ id: 'prod-1', title: 'Test Product', readiness_score: 75 }],
  pageInfo: { page: 1, perPage: 20, total: 1, totalPages: 1 },
};

const PRODUCT_DETAIL = {
  id: 'prod-1',
  title: 'Test Product',
  handle: 'test-product',
  status: 'active',
  readiness_score: 75,
  readiness_grade: 'good',
  images: [],
  score_history: [],
};

const OPTIMIZATION_LIST_RESPONSE = {
  data: [{ id: 'opt-1', product_id: 'prod-1', field: 'title', status: 'pending' }],
  pageInfo: { page: 1, perPage: 20, total: 1, totalPages: 1 },
};

const OPTIMIZATION_DETAIL = {
  id: 'opt-1',
  product_id: 'prod-1',
  field: 'title',
  status: 'pending',
  original_content: 'Old title',
  optimized_content: 'New title',
};

const SCORE_LIST_RESPONSE = {
  data: [{ id: 'score-1', overall_score: 80, grade: 'good', scored_at: '2024-01-01T00:00:00Z' }],
  pageInfo: { page: 1, perPage: 20, total: 1, totalPages: 1 },
};

const SETTINGS = {
  brand_voice: 'casual',
  brand_context: null,
  required_keywords: ['organic'],
  excluded_keywords: [],
  default_fields: ['title', 'description'],
  auto_push_on_approve: false,
};

const WEBHOOK_LIST_RESPONSE = {
  data: [{ id: 'wh-1', url: 'https://example.com/webhook', events: ['product.scored'], status: 'active' }],
  pageInfo: { page: 1, perPage: 20, total: 1, totalPages: 1 },
};

const WEBHOOK_DETAIL = {
  id: 'wh-1',
  url: 'https://example.com/webhook',
  events: ['product.scored'],
  status: 'active',
  failure_count: 0,
  last_success_at: null,
  last_failure_at: null,
  last_error: null,
};

const WEBHOOK_EVENTS_RESPONSE = {
  data: [{ name: 'product.scored', description: 'Fired when a product score is computed' }],
  pageInfo: { page: 1, perPage: 1, total: 1, totalPages: 1 },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('beaconed_products_list', () => {
  it('calls client.products.list and returns JSON text', async () => {
    const client = makeClient();
    vi.mocked(client.products.list).mockResolvedValue(PRODUCT_LIST_RESPONSE);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_products_list', { status: 'active', page: 1 });
    expect(client.products.list).toHaveBeenCalledWith({ status: 'active', page: 1 });
    expect(result).toMatchObject({ content: [{ type: 'text' }] });
    const parsed = JSON.parse((result as { content: Array<{ text: string }> }).content[0].text);
    expect(parsed.data[0].id).toBe('prod-1');
  });
});

describe('beaconed_products_get', () => {
  it('calls client.products.get with the id and returns product detail', async () => {
    const client = makeClient();
    vi.mocked(client.products.get).mockResolvedValue(PRODUCT_DETAIL as ReturnType<typeof client.products.get> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_products_get', { id: 'prod-1' });
    expect(client.products.get).toHaveBeenCalledWith('prod-1');
    const parsed = JSON.parse((result as { content: Array<{ text: string }> }).content[0].text);
    expect(parsed.id).toBe('prod-1');
  });

  it('returns isError:true with a Not Found message on 404', async () => {
    const client = makeClient();
    vi.mocked(client.products.get).mockRejectedValue(
      new BeaconedNotFoundError('Product not found', 'https://beaconed.ai/api/v1/products/missing', 'GET'),
    );
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_products_get', { id: 'missing' });
    expect(result).toMatchObject({ isError: true });
    expect((result as { content: Array<{ text: string }> }).content[0].text).toContain('Not found (404)');
  });

  it('returns isError:true with an auth message on 401', async () => {
    const client = makeClient();
    vi.mocked(client.products.get).mockRejectedValue(
      new BeaconedAuthError('Unauthorized', 'https://beaconed.ai/api/v1/products/x', 'GET'),
    );
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_products_get', { id: 'x' });
    expect(result).toMatchObject({ isError: true });
    expect((result as { content: Array<{ text: string }> }).content[0].text).toContain('Authentication failed');
  });
});

describe('beaconed_products_scores', () => {
  it('calls client.products.scores with id and params', async () => {
    const client = makeClient();
    const scoresResponse = { data: [{ id: 'sc-1', overall_score: 80, grade: 'good', scored_at: '2024-01-01T00:00:00Z', score_change: null, created_at: '2024-01-01T00:00:00Z' }], pageInfo: { page: 1, perPage: 20, total: 1, totalPages: 1 } };
    vi.mocked(client.products.scores).mockResolvedValue(scoresResponse);
    const server = createServer(client);
    await callTool(server, 'beaconed_products_scores', { id: 'prod-1', since: '2024-01-01' });
    expect(client.products.scores).toHaveBeenCalledWith('prod-1', { since: '2024-01-01' });
  });
});

describe('beaconed_products_optimizations', () => {
  it('calls client.products.optimizations with id and params', async () => {
    const client = makeClient();
    vi.mocked(client.products.optimizations).mockResolvedValue(OPTIMIZATION_LIST_RESPONSE);
    const server = createServer(client);
    await callTool(server, 'beaconed_products_optimizations', { id: 'prod-1', status: 'pending' });
    expect(client.products.optimizations).toHaveBeenCalledWith('prod-1', { status: 'pending' });
  });
});

describe('beaconed_optimizations_list', () => {
  it('calls client.optimizations.list and returns JSON', async () => {
    const client = makeClient();
    vi.mocked(client.optimizations.list).mockResolvedValue(OPTIMIZATION_LIST_RESPONSE);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_optimizations_list', { status: 'pending' });
    expect(client.optimizations.list).toHaveBeenCalledWith({ status: 'pending' });
    const parsed = JSON.parse((result as { content: Array<{ text: string }> }).content[0].text);
    expect(parsed.data[0].id).toBe('opt-1');
  });
});

describe('beaconed_optimizations_get', () => {
  it('calls client.optimizations.get with id', async () => {
    const client = makeClient();
    vi.mocked(client.optimizations.get).mockResolvedValue(OPTIMIZATION_DETAIL as ReturnType<typeof client.optimizations.get> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_optimizations_get', { id: 'opt-1' });
    expect(client.optimizations.get).toHaveBeenCalledWith('opt-1');
    const parsed = JSON.parse((result as { content: Array<{ text: string }> }).content[0].text);
    expect(parsed.original_content).toBe('Old title');
  });
});

describe('beaconed_scores_list', () => {
  it('calls client.scores.list with filters', async () => {
    const client = makeClient();
    vi.mocked(client.scores.list).mockResolvedValue(SCORE_LIST_RESPONSE);
    const server = createServer(client);
    await callTool(server, 'beaconed_scores_list', { grade: 'good' });
    expect(client.scores.list).toHaveBeenCalledWith({ grade: 'good' });
  });
});

describe('beaconed_scores_latest', () => {
  it('calls client.scores.latest', async () => {
    const client = makeClient();
    vi.mocked(client.scores.latest).mockResolvedValue(SCORE_LIST_RESPONSE);
    const server = createServer(client);
    await callTool(server, 'beaconed_scores_latest', {});
    expect(client.scores.latest).toHaveBeenCalledWith({});
  });
});

describe('beaconed_settings_get', () => {
  it('calls client.settings.get and returns settings JSON', async () => {
    const client = makeClient();
    vi.mocked(client.settings.get).mockResolvedValue(SETTINGS);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_settings_get', {});
    expect(client.settings.get).toHaveBeenCalled();
    const parsed = JSON.parse((result as { content: Array<{ text: string }> }).content[0].text);
    expect(parsed.brand_voice).toBe('casual');
  });
});

describe('beaconed_webhooks_list', () => {
  it('calls client.webhooks.list', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.list).mockResolvedValue(WEBHOOK_LIST_RESPONSE);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_webhooks_list', { per_page: 10 });
    expect(client.webhooks.list).toHaveBeenCalledWith({ per_page: 10 });
    const parsed = JSON.parse((result as { content: Array<{ text: string }> }).content[0].text);
    expect(parsed.data[0].id).toBe('wh-1');
  });
});

describe('beaconed_webhooks_get', () => {
  it('calls client.webhooks.get with id', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.get).mockResolvedValue(WEBHOOK_DETAIL as ReturnType<typeof client.webhooks.get> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_webhooks_get', { id: 'wh-1' });
    expect(client.webhooks.get).toHaveBeenCalledWith('wh-1');
    const parsed = JSON.parse((result as { content: Array<{ text: string }> }).content[0].text);
    expect(parsed.last_error).toBeNull();
  });
});

describe('beaconed_webhooks_events', () => {
  it('calls client.webhooks.events with no id and returns events', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.events).mockResolvedValue(WEBHOOK_EVENTS_RESPONSE);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_webhooks_events', {});
    expect(client.webhooks.events).toHaveBeenCalledWith(undefined, {});
    const parsed = JSON.parse((result as { content: Array<{ text: string }> }).content[0].text);
    expect(parsed.data[0].name).toBe('product.scored');
  });
});

describe('error mapping', () => {
  it('maps rate limit error to isError:true with retry seconds', async () => {
    const client = makeClient();
    vi.mocked(client.settings.get).mockRejectedValue(
      new BeaconedRateLimitError('Too many requests', 'https://beaconed.ai/api/v1/settings', 'GET', 30),
    );
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_settings_get', {});
    expect(result).toMatchObject({ isError: true });
    expect((result as { content: Array<{ text: string }> }).content[0].text).toContain('Retry after 30s');
  });

  it('maps unexpected errors to isError:true', async () => {
    const client = makeClient();
    vi.mocked(client.settings.get).mockRejectedValue(new Error('Something weird'));
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_settings_get', {});
    expect(result).toMatchObject({ isError: true });
    expect((result as { content: Array<{ text: string }> }).content[0].text).toContain('Something weird');
  });
});

describe('beaconed://products resource', () => {
  it('reads beaconed://products and returns JSON list', async () => {
    const client = makeClient();
    vi.mocked(client.products.list).mockResolvedValue(PRODUCT_LIST_RESPONSE);
    const server = createServer(client);

    // Access registered resources via the internal map
    const resources = (server as unknown as { _registeredResources: Record<string, { readCallback: (uri: URL) => Promise<unknown> }> })._registeredResources;
    const resource = resources['beaconed://products'];
    expect(resource).toBeDefined();

    const result = await resource.readCallback(new URL('beaconed://products'));
    expect(client.products.list).toHaveBeenCalledWith({ per_page: 20 });
    const contents = (result as { contents: Array<{ text: string; mimeType: string }> }).contents;
    expect(contents[0].mimeType).toBe('application/json');
    const parsed = JSON.parse(contents[0].text);
    expect(parsed.data[0].id).toBe('prod-1');
  });
});

describe('beaconed://optimizations resource', () => {
  it('reads beaconed://optimizations and returns JSON list', async () => {
    const client = makeClient();
    vi.mocked(client.optimizations.list).mockResolvedValue(OPTIMIZATION_LIST_RESPONSE);
    const server = createServer(client);

    const resources = (server as unknown as { _registeredResources: Record<string, { readCallback: (uri: URL) => Promise<unknown> }> })._registeredResources;
    const resource = resources['beaconed://optimizations'];
    expect(resource).toBeDefined();

    const result = await resource.readCallback(new URL('beaconed://optimizations'));
    expect(client.optimizations.list).toHaveBeenCalledWith({ per_page: 20 });
    const contents = (result as { contents: Array<{ text: string }> }).contents;
    const parsed = JSON.parse(contents[0].text);
    expect(parsed.data[0].id).toBe('opt-1');
  });
});
