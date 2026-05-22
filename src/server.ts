#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BeaconedClient } from '@beaconed/api-client';
import { registerAllTools } from './tools/index.js';
import { registerAllResources } from './resources/index.js';

const SERVER_NAME = 'beaconed-mcp';
const SERVER_VERSION = '0.0.2';

export function createServer(client: BeaconedClient): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  registerAllTools(server, client);
  registerAllResources(server, client);

  return server;
}

/**
 * True when `entry` (process.argv[1]) refers to the same file as `moduleUrl`
 * (import.meta.url), resolving symlinks on both sides. Exported for testing.
 *
 * Symlink resolution is the whole point. When the server is launched through
 * its installed bin (`npm install -g`) or `npx`, argv[1] is a symlink/shim
 * (e.g. .../bin/beaconed-mcp) while import.meta.url resolves to the real dist
 * file. A raw equality check never matches, so the startup block is skipped and
 * the process exits 0 without ever connecting the transport — the server
 * appears to "start" then dies with no tools and no error.
 * See https://github.com/beaconed/beaconed-mcp/issues/1.
 */
export function isEntryPoint(entry: string | undefined, moduleUrl: string): boolean {
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

if (isEntryPoint(process.argv[1], import.meta.url)) {
  const apiKey = process.env['BEACONED_API_KEY'];
  if (!apiKey) {
    process.stderr.write('BEACONED_API_KEY environment variable is required\n');
    process.exit(2);
  }

  const client = new BeaconedClient({
    apiKey,
    baseUrl: process.env['BEACONED_BASE_URL'] ?? 'https://beaconed.ai',
    userAgent: 'beaconed-mcp/0.0.2',
  });

  const server = createServer(client);
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err: unknown) => {
    process.stderr.write(`Failed to start server: ${String(err)}\n`);
    process.exit(1);
  });
}
