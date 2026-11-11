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
    expect(parseImportArgs(['--min-sitelinks', '25'])).toEqual({ bank: 'all', minSitelinks: 25 });
    expect(parseImportArgs(['--cache-dir', '/tmp/x'])).toEqual({ bank: 'all', cacheDir: '/tmp/x' });
    expect(parseImportArgs([])).toEqual({ bank: 'all' });
    expect(() => parseImportArgs(['--min-sitelinks', 'abc'])).toThrowError(validation);
    expect(() => parseImportArgs(['--min-sitelinks', '-1'])).toThrowError(validation);
    expect(() => parseImportArgs(['--bogus'])).toThrowError(validation);
  });

  it('parses --bank and --min-sitelinks-timeline (TS-1)', () => {
    expect(parseImportArgs(['--bank=timeline'])).toEqual({ bank: 'timeline' });
    expect(parseImportArgs([])).toEqual({ bank: 'all' });
    expect(
      parseImportArgs([
        '--bank',
        'terms',
        '--min-sitelinks-timeline',
        '25',
        '--min-sitelinks',
        '12',
      ]),
    ).toEqual({ bank: 'terms', minSitelinksTimeline: 25, minSitelinks: 12 });
  });

  it('rejects invalid --bank and --min-sitelinks-timeline (TS-2)', () => {
    expect(() => parseImportArgs(['--bank=facts'])).toThrowError(
      expect.objectContaining({
        code: 'validation_error',
        message: expect.stringContaining('terms, timeline, all'),
      }),
    );
    for (const bad of ['-1', 'diez']) {
      expect(() => parseImportArgs(['--min-sitelinks-timeline', bad])).toThrowError(
        expect.objectContaining({
          code: 'validation_error',
          message: expect.stringContaining(
            '--min-sitelinks-timeline debe ser un entero mayor o igual a 0',
          ),
        }),
      );
    }
  });
});
