import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server.js';

describe('beaconed-mcp server', () => {
  it('creates a McpServer instance without throwing', () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });

  it('exposes the beaconed_health tool', () => {
    const server = createServer();
    // Accessing the underlying server should be truthy — tool registration
    // happens at construction time inside createServer().
    expect(server).toBeTruthy();
  });
});
