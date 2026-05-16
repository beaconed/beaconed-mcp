import { describe, it, expect, vi } from 'vitest';
import { BeaconedClient } from '@joshre/beaconed-api-client';
import { BeaconedValidationError } from '@joshre/beaconed-api-client';
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

type AnyServer = ReturnType<typeof createServer>;
type RegisteredTool = { handler: (args: Record<string, unknown>) => Promise<unknown>; annotations?: { destructiveHint?: boolean; idempotentHint?: boolean } };

async function callTool(server: AnyServer, name: string, args: Record<string, unknown> = {}) {
  const tools = (server as unknown as { _registeredTools: Record<string, RegisteredTool> })._registeredTools;
  const tool = tools[name];
  if (!tool) throw new Error(`Tool "${name}" not registered`);
  return tool.handler(args);
}

function getAnnotations(server: AnyServer, name: string) {
  const tools = (server as unknown as { _registeredTools: Record<string, RegisteredTool> })._registeredTools;
  const tool = tools[name];
  if (!tool) throw new Error(`Tool "${name}" not registered`);
  return tool.annotations ?? {};
}

type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean };

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const PRODUCT_DETAIL = {
  id: 'prod-1',
  title: 'Organic Shampoo',
  handle: 'organic-shampoo',
  status: 'active',
  readiness_score: 72,
  readiness_grade: 'good',
  images: [],
  score_history: [],
};

const SYNC_RESULT = { message: 'Sync queued', product_id: 'prod-1' };

const OPTIMIZE_RESULT = {
  message: 'Optimization queued',
  product_id: 'prod-1',
  product_title: 'Organic Shampoo',
  status: 'queued',
};

const SCORE_CALC_RESULT = {
  product_id: 'prod-1',
  overall_score: 80,
  grade: 'good',
  scored_at: '2024-06-01T00:00:00Z',
};

const OPTIMIZATION_DETAIL = {
  id: 'opt-1',
  product_id: 'prod-1',
  field: 'title',
  status: 'approved',
  original_content: 'Old title',
  optimized_content: 'New title',
  rejection_reason: null,
};

const APPLY_RESULT = { message: 'Application queued', optimization_id: 'opt-1' };
const REVERT_RESULT = { message: 'Reversion queued', optimization_id: 'opt-1' };

const WEBHOOK_WITH_SECRET = {
  id: 'wh-1',
  url: 'https://example.com/hook',
  events: ['product.scored'],
  status: 'active',
  failure_count: 0,
  last_success_at: null,
  last_failure_at: null,
  last_error: null,
  secret: 'whsec_abc123supersecret',
};

const WEBHOOK_DETAIL = {
  id: 'wh-1',
  url: 'https://example.com/hook',
  events: ['product.scored', 'product.synced'],
  status: 'active',
  failure_count: 0,
  last_success_at: null,
  last_failure_at: null,
  last_error: null,
};

const WEBHOOK_TEST_RESULT = { message: 'Test event queued', webhook_id: 'wh-1' };

// ---------------------------------------------------------------------------
// Products mutations
// ---------------------------------------------------------------------------

describe('beaconed_products_create', () => {
  it('calls client.products.create with input and returns ProductDetail JSON', async () => {
    const client = makeClient();
    vi.mocked(client.products.create).mockResolvedValue(PRODUCT_DETAIL as ReturnType<typeof client.products.create> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_products_create', {
      title: 'Organic Shampoo',
      status: 'active',
    }) as ToolResult;
    expect(client.products.create).toHaveBeenCalledWith({ title: 'Organic Shampoo', status: 'active' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBe('prod-1');
  });

  it('returns isError:true on validation error with errors[] visible', async () => {
    const client = makeClient();
    vi.mocked(client.products.create).mockRejectedValue(
      new BeaconedValidationError(
        'Unprocessable',
        ['title is too long', 'handle is invalid'],
        'https://beaconed.ai/api/v1/products',
        'POST',
      ),
    );
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_products_create', { title: 'x'.repeat(300) }) as ToolResult;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('title is too long');
    expect(result.content[0].text).toContain('handle is invalid');
  });
});

describe('beaconed_products_update', () => {
  it('calls client.products.update with id and partial input', async () => {
    const client = makeClient();
    vi.mocked(client.products.update).mockResolvedValue(PRODUCT_DETAIL as ReturnType<typeof client.products.update> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    await callTool(server, 'beaconed_products_update', { id: 'prod-1', meta_title: 'New SEO Title' });
    expect(client.products.update).toHaveBeenCalledWith('prod-1', { meta_title: 'New SEO Title' });
  });

  it('returns updated product JSON', async () => {
    const client = makeClient();
    vi.mocked(client.products.update).mockResolvedValue({ ...PRODUCT_DETAIL, title: 'Updated' } as ReturnType<typeof client.products.update> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_products_update', { id: 'prod-1', title: 'Updated' }) as ToolResult;
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.title).toBe('Updated');
  });
});

describe('beaconed_products_sync', () => {
  it('calls client.products.sync with id', async () => {
    const client = makeClient();
    vi.mocked(client.products.sync).mockResolvedValue(SYNC_RESULT);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_products_sync', { id: 'prod-1' }) as ToolResult;
    expect(client.products.sync).toHaveBeenCalledWith('prod-1');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.message).toBe('Sync queued');
  });
});

describe('beaconed_products_optimize', () => {
  it('calls client.products.optimize with id and fields array', async () => {
    const client = makeClient();
    vi.mocked(client.products.optimize).mockResolvedValue(OPTIMIZE_RESULT);
    const server = createServer(client);
    await callTool(server, 'beaconed_products_optimize', { id: 'prod-1', fields: ['title', 'description'] });
    expect(client.products.optimize).toHaveBeenCalledWith('prod-1', { fields: ['title', 'description'] });
  });

  it('calls client.products.optimize with undefined input when fields omitted', async () => {
    const client = makeClient();
    vi.mocked(client.products.optimize).mockResolvedValue(OPTIMIZE_RESULT);
    const server = createServer(client);
    await callTool(server, 'beaconed_products_optimize', { id: 'prod-1' });
    expect(client.products.optimize).toHaveBeenCalledWith('prod-1', undefined);
  });
});

describe('beaconed_products_calculate_score', () => {
  it('calls client.products.calculateScore with id and returns score result', async () => {
    const client = makeClient();
    vi.mocked(client.products.calculateScore).mockResolvedValue(SCORE_CALC_RESULT as ReturnType<typeof client.products.calculateScore> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_products_calculate_score', { id: 'prod-1' }) as ToolResult;
    expect(client.products.calculateScore).toHaveBeenCalledWith('prod-1');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.overall_score).toBe(80);
  });
});

// ---------------------------------------------------------------------------
// Optimizations mutations
// ---------------------------------------------------------------------------

describe('beaconed_optimizations_approve', () => {
  it('calls client.optimizations.approve with id', async () => {
    const client = makeClient();
    vi.mocked(client.optimizations.approve).mockResolvedValue(OPTIMIZATION_DETAIL as ReturnType<typeof client.optimizations.approve> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_optimizations_approve', { id: 'opt-1' }) as ToolResult;
    expect(client.optimizations.approve).toHaveBeenCalledWith('opt-1');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe('approved');
  });
});

describe('beaconed_optimizations_reject', () => {
  it('calls client.optimizations.reject without reason when omitted', async () => {
    const client = makeClient();
    vi.mocked(client.optimizations.reject).mockResolvedValue({ ...OPTIMIZATION_DETAIL, status: 'rejected' } as ReturnType<typeof client.optimizations.reject> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    await callTool(server, 'beaconed_optimizations_reject', { id: 'opt-1' });
    expect(client.optimizations.reject).toHaveBeenCalledWith('opt-1', undefined);
  });

  it('calls client.optimizations.reject with reason when provided', async () => {
    const client = makeClient();
    vi.mocked(client.optimizations.reject).mockResolvedValue({ ...OPTIMIZATION_DETAIL, status: 'rejected', rejection_reason: 'Off-brand' } as ReturnType<typeof client.optimizations.reject> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_optimizations_reject', { id: 'opt-1', reason: 'Off-brand' }) as ToolResult;
    expect(client.optimizations.reject).toHaveBeenCalledWith('opt-1', { reason: 'Off-brand' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.rejection_reason).toBe('Off-brand');
  });
});

describe('beaconed_optimizations_apply', () => {
  it('calls client.optimizations.apply and returns result JSON', async () => {
    const client = makeClient();
    vi.mocked(client.optimizations.apply).mockResolvedValue(APPLY_RESULT);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_optimizations_apply', { id: 'opt-1' }) as ToolResult;
    expect(client.optimizations.apply).toHaveBeenCalledWith('opt-1');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.optimization_id).toBe('opt-1');
  });
});

describe('beaconed_optimizations_revert', () => {
  it('calls client.optimizations.revert and returns result JSON', async () => {
    const client = makeClient();
    vi.mocked(client.optimizations.revert).mockResolvedValue(REVERT_RESULT);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_optimizations_revert', { id: 'opt-1' }) as ToolResult;
    expect(client.optimizations.revert).toHaveBeenCalledWith('opt-1');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.message).toBe('Reversion queued');
  });
});

// ---------------------------------------------------------------------------
// Webhooks mutations
// ---------------------------------------------------------------------------

describe('beaconed_webhooks_create', () => {
  it('calls client.webhooks.create with url and events', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.create).mockResolvedValue(WEBHOOK_WITH_SECRET as ReturnType<typeof client.webhooks.create> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    await callTool(server, 'beaconed_webhooks_create', {
      url: 'https://example.com/hook',
      events: ['product.scored'],
    });
    expect(client.webhooks.create).toHaveBeenCalledWith({
      url: 'https://example.com/hook',
      events: ['product.scored'],
    });
  });

  it('exposes the secret in the response text', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.create).mockResolvedValue(WEBHOOK_WITH_SECRET as ReturnType<typeof client.webhooks.create> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_webhooks_create', {
      url: 'https://example.com/hook',
      events: ['product.scored'],
    }) as ToolResult;
    const text = result.content[0].text;
    expect(text).toContain('SECRET is shown only once');
    expect(text).toContain('whsec_abc123supersecret');
  });

  it('includes the full webhook object in the response', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.create).mockResolvedValue(WEBHOOK_WITH_SECRET as ReturnType<typeof client.webhooks.create> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_webhooks_create', {
      url: 'https://example.com/hook',
      events: ['optimization.applied'],
    }) as ToolResult;
    const text = result.content[0].text;
    // Parse just the JSON portion (after the first line)
    const jsonPart = text.slice(text.indexOf('{'));
    const parsed = JSON.parse(jsonPart);
    expect(parsed.id).toBe('wh-1');
  });
});

describe('beaconed_webhooks_update', () => {
  it('calls client.webhooks.update with id and partial input', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.update).mockResolvedValue(WEBHOOK_DETAIL as ReturnType<typeof client.webhooks.update> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    await callTool(server, 'beaconed_webhooks_update', {
      id: 'wh-1',
      status: 'paused',
    });
    expect(client.webhooks.update).toHaveBeenCalledWith('wh-1', { status: 'paused' });
  });

  it('returns updated webhook JSON', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.update).mockResolvedValue({ ...WEBHOOK_DETAIL, url: 'https://new.example.com/hook' } as ReturnType<typeof client.webhooks.update> extends Promise<infer T> ? T : never);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_webhooks_update', {
      id: 'wh-1',
      url: 'https://new.example.com/hook',
    }) as ToolResult;
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.url).toBe('https://new.example.com/hook');
  });
});

describe('beaconed_webhooks_delete', () => {
  it('calls client.webhooks.delete with id', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.delete).mockResolvedValue(undefined);
    const server = createServer(client);
    await callTool(server, 'beaconed_webhooks_delete', { id: 'wh-1' });
    expect(client.webhooks.delete).toHaveBeenCalledWith('wh-1');
  });

  it('returns confirmation string with webhook id', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.delete).mockResolvedValue(undefined);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_webhooks_delete', { id: 'wh-1' }) as ToolResult;
    expect(result.content[0].text).toBe('Webhook wh-1 deleted.');
  });
});

describe('beaconed_webhooks_test', () => {
  it('calls client.webhooks.test with id and returns test result', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.test).mockResolvedValue(WEBHOOK_TEST_RESULT);
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_webhooks_test', { id: 'wh-1' }) as ToolResult;
    expect(client.webhooks.test).toHaveBeenCalledWith('wh-1');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.webhook_id).toBe('wh-1');
    expect(parsed.message).toBe('Test event queued');
  });
});

// ---------------------------------------------------------------------------
// Annotations smoke test
// ---------------------------------------------------------------------------

describe('destructive/idempotent annotations', () => {
  it('apply has destructiveHint:true and idempotentHint:false', () => {
    const server = createServer(makeClient());
    const ann = getAnnotations(server, 'beaconed_optimizations_apply');
    expect(ann.destructiveHint).toBe(true);
    expect(ann.idempotentHint).toBe(false);
  });

  it('revert has destructiveHint:true and idempotentHint:false', () => {
    const server = createServer(makeClient());
    const ann = getAnnotations(server, 'beaconed_optimizations_revert');
    expect(ann.destructiveHint).toBe(true);
    expect(ann.idempotentHint).toBe(false);
  });

  it('webhooks delete has destructiveHint:true and idempotentHint:true', () => {
    const server = createServer(makeClient());
    const ann = getAnnotations(server, 'beaconed_webhooks_delete');
    expect(ann.destructiveHint).toBe(true);
    expect(ann.idempotentHint).toBe(true);
  });

  it('products create has destructiveHint:false and idempotentHint:false', () => {
    const server = createServer(makeClient());
    const ann = getAnnotations(server, 'beaconed_products_create');
    expect(ann.destructiveHint).toBe(false);
    expect(ann.idempotentHint).toBe(false);
  });

  it('products update has destructiveHint:false and idempotentHint:true', () => {
    const server = createServer(makeClient());
    const ann = getAnnotations(server, 'beaconed_products_update');
    expect(ann.destructiveHint).toBe(false);
    expect(ann.idempotentHint).toBe(true);
  });

  it('optimizations approve has destructiveHint:false and idempotentHint:true', () => {
    const server = createServer(makeClient());
    const ann = getAnnotations(server, 'beaconed_optimizations_approve');
    expect(ann.destructiveHint).toBe(false);
    expect(ann.idempotentHint).toBe(true);
  });

  it('webhooks create has destructiveHint:false and idempotentHint:false', () => {
    const server = createServer(makeClient());
    const ann = getAnnotations(server, 'beaconed_webhooks_create');
    expect(ann.destructiveHint).toBe(false);
    expect(ann.idempotentHint).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Validation error mapping for mutations
// ---------------------------------------------------------------------------

describe('validation error (422) mapping for mutations', () => {
  it('exposes errors[] array in text for webhook create', async () => {
    const client = makeClient();
    vi.mocked(client.webhooks.create).mockRejectedValue(
      new BeaconedValidationError(
        'Unprocessable',
        ['url must be HTTPS', 'events must not be empty'],
        'https://beaconed.ai/api/v1/webhooks',
        'POST',
      ),
    );
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_webhooks_create', {
      url: 'http://insecure.example.com',
      events: ['product.scored'],
    }) as ToolResult;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('url must be HTTPS');
    expect(result.content[0].text).toContain('events must not be empty');
  });

  it('exposes errors[] array in text for product update', async () => {
    const client = makeClient();
    vi.mocked(client.products.update).mockRejectedValue(
      new BeaconedValidationError(
        'Unprocessable',
        ['handle already taken'],
        'https://beaconed.ai/api/v1/products/prod-1',
        'PATCH',
      ),
    );
    const server = createServer(client);
    const result = await callTool(server, 'beaconed_products_update', {
      id: 'prod-1',
      handle: 'already-taken',
    }) as ToolResult;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('handle already taken');
  });
});
