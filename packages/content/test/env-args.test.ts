import { describe, expect, it } from 'vitest';

import { parseImportArgs } from '../scripts/import-banks/args';
import { loadImportEnv } from '../scripts/import-banks/env';

const validation = expect.objectContaining({ code: 'validation_error' });

describe('env and args', () => {
  it('validates WIKIMEDIA_CONTACT (TS-31)', () => {
    expect(() => loadImportEnv({})).toThrowError(
      expect.objectContaining({
        code: 'validation_error',
        message: expect.stringContaining('WIKIMEDIA_CONTACT'),
      }),
    );
    expect(loadImportEnv({ WIKIMEDIA_CONTACT: 'dev@example.com' })).toEqual({
      WIKIMEDIA_CONTACT: 'dev@example.com',
    });
  });

  it('parses --min-sitelinks and --cache-dir (TS-31)', () => {
    expect(parseImportArgs(['--min-sitelinks', '25'])).toEqual({ minSitelinks: 25 });
    expect(parseImportArgs(['--cache-dir', '/tmp/x'])).toEqual({ cacheDir: '/tmp/x' });
    expect(parseImportArgs([])).toEqual({});
    expect(() => parseImportArgs(['--min-sitelinks', 'abc'])).toThrowError(validation);
    expect(() => parseImportArgs(['--min-sitelinks', '-1'])).toThrowError(validation);
    expect(() => parseImportArgs(['--bogus'])).toThrowError(validation);
  });
});
