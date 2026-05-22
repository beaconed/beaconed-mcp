import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// End-to-end regression test for https://github.com/beaconed/beaconed-mcp/issues/1:
// the "dead on arrival via npm install -g / npx" bug. The entry-point unit test
// (test/entry-point.test.ts) covers isEntryPoint() in isolation; this exercises
// the actual built bin the way a user's MCP client does — through a symlinked
// shim — so a regression in the bin wiring or build output is caught too.
//
// With no BEACONED_API_KEY, the bin must print the required-env error and exit 2.
// The original argv[1]-vs-import.meta.url guard silently exited 0 here.

const root = resolve(fileURLToPath(import.meta.url), '../..');
const distBin = join(root, 'dist', 'server.js');

describe('installed bin smoke test', () => {
  beforeAll(() => {
    if (!existsSync(distBin)) {
      execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
    }
  }, 60_000);

  it('exits 2 with the required-env message when run via a symlinked bin and no API key', () => {
    const dir = mkdtempSync(join(tmpdir(), 'beaconed-mcp-bin-'));
    const shim = join(dir, 'beaconed-mcp');
    symlinkSync(distBin, shim);

    const env = { ...process.env };
    delete env['BEACONED_API_KEY'];
    const result = spawnSync(process.execPath, [shim], {
      input: '',
      encoding: 'utf8',
      env,
      timeout: 10_000,
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('BEACONED_API_KEY environment variable is required');
  });
});
