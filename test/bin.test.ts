import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('beaconed-mcp bin', () => {
  it('publishes a dedicated bin entry instead of the import-safe server module', async () => {
    const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8')) as {
      bin: Record<string, string>;
    };

    expect(packageJson.bin['beaconed-mcp']).toBe('./dist/bin.js');
  });

  it('runs through a symlinked bin path and reports missing API key', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'beaconed-mcp-bin-'));
    const binPath = join(tempDir, 'beaconed-mcp');

    try {
      symlinkSync(resolve('src/bin.ts'), binPath);

      await expect(
        execFileAsync(process.execPath, ['--import', 'tsx', binPath], {
          env: {
            ...process.env,
            BEACONED_API_KEY: '',
          },
        }),
      ).rejects.toMatchObject({
        code: 2,
        stderr: expect.stringContaining('BEACONED_API_KEY environment variable is required'),
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
