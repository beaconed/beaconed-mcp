#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from './client-bootstrap.js';
import { createServer } from './server.js';

const server = createServer(createClient());
const transport = new StdioServerTransport();

server.connect(transport).catch((err: unknown) => {
  process.stderr.write(`Failed to start server: ${String(err)}\n`);
  process.exit(1);
});
