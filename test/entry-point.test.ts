import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isEntryPoint } from '../src/server.js';

// Regression coverage for https://github.com/beaconed/beaconed-mcp/issues/1:
// when launched through the npm-installed bin or npx, process.argv[1] is a
// symlink while import.meta.url is the real dist file. The entry check must
// resolve symlinks so the server still starts.
describe('isEntryPoint', () => {
  let dir: string;
  let real: string;
  let link: string;
  let other: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'beaconed-mcp-entry-'));
    real = join(dir, 'server.js');
    link = join(dir, 'beaconed-mcp'); // stands in for the npm/npx bin symlink
    other = join(dir, 'other.js');
    writeFileSync(real, '// stub entry');
    writeFileSync(other, '// unrelated');
    symlinkSync(real, link);
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('treats a symlinked argv[1] as the entry point (the npm-bin / npx case)', () => {
    expect(isEntryPoint(link, pathToFileURL(real).href)).toBe(true);
  });

  it('matches when argv[1] is the real path', () => {
    expect(isEntryPoint(real, pathToFileURL(real).href)).toBe(true);
  });

  it('returns false when argv[1] is undefined (module imported, not executed)', () => {
    expect(isEntryPoint(undefined, pathToFileURL(real).href)).toBe(false);
  });

  it('returns false for an unrelated entry path', () => {
    expect(isEntryPoint(other, pathToFileURL(real).href)).toBe(false);
  });
});
