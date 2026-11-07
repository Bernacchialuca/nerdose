import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { resolveCacheDir } from '../scripts/import-banks/cache';

const repoRoot = '/work/nerdose';

describe('resolveCacheDir', () => {
  it('defaults to the home cache and rejects paths inside the repo (TS-28)', () => {
    expect(resolveCacheDir(undefined, repoRoot)).toBe(join(homedir(), '.cache', 'nerdose-content'));
    expect(resolveCacheDir('/tmp/nc', repoRoot)).toBe('/tmp/nc');
    expect(() => resolveCacheDir(`${repoRoot}/packages/content/.cache`, repoRoot)).toThrowError(
      expect.objectContaining({
        code: 'validation_error',
        message: expect.stringContaining('fuera del repo'),
      }),
    );
  });
});
