import { describe, expect, it } from 'vitest';

import { resolveDate, selectStatements } from '../scripts/import-banks/rules';
import type { DateStatement } from '../scripts/import-banks/wikidata';

const st = (
  time: string,
  precision: number,
  rank: DateStatement['rank'] = 'normal',
  extra: Partial<DateStatement> = {},
): DateStatement => ({ property: 'P571', time, precision, rank, uncertain: false, ...extra });

const NOW = { currentYear: 2026 };
const ok = (event_date: string, date_precision: string) => ({
  ok: true,
  event_date,
  date_precision,
});
const disputed = { ok: false, reason: 'disputed_date' };
const imprecise = { ok: false, reason: 'imprecise_date' };

describe('resolveDate', () => {
  it('keeps a single month date (TS-6)', () => {
    expect(resolveDate([st('2014-06-01T00:00:00Z', 10)], NOW)).toEqual(ok('2014-06-01', 'month'));
  });

  it('normalizes by precision without inventing month or day (TS-7)', () => {
    expect(resolveDate([st('1991-02-20T00:00:00Z', 9)], NOW)).toEqual(ok('1991-01-01', 'year'));
    expect(resolveDate([st('1995-05-23T00:00:00Z', 11)], NOW)).toEqual(ok('1995-05-23', 'day'));
    expect(resolveDate([st('2009-11-10T15:00:00Z', 13)], NOW)).toEqual(ok('2009-11-10', 'day'));
    expect(resolveDate([st('2014-06-15T00:00:00Z', 10)], NOW)).toEqual(ok('2014-06-01', 'month'));
  });

  it('rejects different normal dates without a preferred one (TS-8)', () => {
    expect(
      resolveDate([st('1991-01-01T00:00:00Z', 9), st('1994-01-01T00:00:00Z', 9)], NOW),
    ).toMatchObject(disputed);
    expect(
      resolveDate([st('2009-11-01T00:00:00Z', 10), st('2009-12-01T00:00:00Z', 10)], NOW),
    ).toMatchObject(disputed);
  });

  it('lets a single preferred value win and ignores deprecated ones (TS-9)', () => {
    expect(
      resolveDate(
        [st('1995-05-23T00:00:00Z', 11, 'preferred'), st('1994-01-01T00:00:00Z', 9)],
        NOW,
      ),
    ).toEqual(ok('1995-05-23', 'day'));
    expect(
      resolveDate(
        [st('1990-01-01T00:00:00Z', 9, 'deprecated'), st('1995-01-01T00:00:00Z', 9)],
        NOW,
      ),
    ).toEqual(ok('1995-01-01', 'year'));
  });

  it('rejects several different preferred values (TS-10)', () => {
    expect(
      resolveDate(
        [st('1995-05-23T00:00:00Z', 11, 'preferred'), st('1996-01-23T00:00:00Z', 11, 'preferred')],
        NOW,
      ),
    ).toMatchObject(disputed);
  });

  it('accepts values compatible at the common precision (TS-11)', () => {
    expect(
      resolveDate([st('2009-01-01T00:00:00Z', 9), st('2009-11-10T00:00:00Z', 11)], NOW),
    ).toEqual(ok('2009-11-10', 'day'));
  });

  it('rejects uncertainty ranges unless the statement is deprecated (TS-12)', () => {
    expect(
      resolveDate([st('1983-01-01T00:00:00Z', 9, 'normal', { uncertain: true })], NOW),
    ).toMatchObject(disputed);
    expect(
      resolveDate(
        [
          st('1983-01-01T00:00:00Z', 9, 'preferred'),
          st('1982-01-01T00:00:00Z', 9, 'deprecated', { uncertain: true }),
        ],
        NOW,
      ),
    ).toEqual(ok('1983-01-01', 'year'));
  });

  it('rejects imprecise or out-of-range dates (TS-13)', () => {
    for (const dates of [
      [st('1990-01-01T00:00:00Z', 8)],
      [st('1799-01-01T00:00:00Z', 9)],
      [st('2027-01-01T00:00:00Z', 9)],
      [st('-0500-01-01T00:00:00Z', 9)],
      [st('1990-01-01T00:00:00Z', 9, 'deprecated')],
      [st('basura', 9)],
    ]) {
      expect(resolveDate(dates, NOW)).toMatchObject(imprecise);
    }
  });

  it('accepts the edges of the year range (TS-14)', () => {
    expect(resolveDate([st('1800-01-01T00:00:00Z', 9)], NOW)).toEqual(ok('1800-01-01', 'year'));
    expect(resolveDate([st('2026-03-01T00:00:00Z', 10)], NOW)).toEqual(ok('2026-03-01', 'month'));
  });

  it('handles month and day 00 (TS-15)', () => {
    expect(resolveDate([st('2014-00-00T00:00:00Z', 10)], NOW)).toMatchObject(imprecise);
    expect(resolveDate([st('2014-06-00T00:00:00Z', 11)], NOW)).toEqual(ok('2014-06-01', 'month'));
    expect(resolveDate([st('2014-00-00T00:00:00Z', 11)], NOW)).toEqual(ok('2014-01-01', 'year'));
  });

  it('carries the best available date for rejections (TS-25)', () => {
    const disputedResult = resolveDate(
      [st('1991-01-01T00:00:00Z', 9), st('1994-01-01T00:00:00Z', 9)],
      NOW,
    );
    expect(disputedResult).toMatchObject({
      fallback: { event_date: '1991-01-01', date_precision: 'year' },
    });
    expect(resolveDate([st('1990-01-01T00:00:00Z', 9, 'deprecated')], NOW)).toMatchObject({
      fallback: { event_date: '0000-01-01', date_precision: 'year' },
    });
    expect(resolveDate([st('1990-05-01T00:00:00Z', 8)], NOW)).toMatchObject({
      fallback: { event_date: '1990-01-01', date_precision: 'year' },
    });
  });
});

describe('selectStatements', () => {
  const cls = { dateProperty: 'P577', fallbackProperty: 'P571' } as const;
  const p571 = st('1976-04-01T00:00:00Z', 10);
  const p577 = st('1977-06-10T00:00:00Z', 11, 'normal', { property: 'P577' });

  it('falls back to the second property only when the first has no live value (TS-16)', () => {
    expect(selectStatements([p571], cls)).toEqual([p571]);
    expect(selectStatements([p577, st('1976-01-01T00:00:00Z', 9)], cls)).toEqual([p577]);
    expect(resolveDate(selectStatements([p577, st('1976-01-01T00:00:00Z', 9)], cls), NOW)).toEqual(
      ok('1977-06-10', 'day'),
    );
    expect(selectStatements([p571], { dateProperty: 'P577' })).toEqual([]);
  });
});
