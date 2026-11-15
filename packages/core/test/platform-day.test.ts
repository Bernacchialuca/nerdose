import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import {
  challengeNumber,
  nextResetAt,
  secondsToReset,
  today,
  validateMetricsRange,
} from '../src/platform-day';
import type { MetricsRangeReason, MetricsRangeResult } from '../src/platform-day';

afterEach(() => {
  vi.useRealTimers();
});

describe('today', () => {
  it.each([
    ['2026-12-01T23:59:59.999Z', '2026-12-01'],
    ['2026-12-02T00:00:00.000Z', '2026-12-02'],
    ['2026-12-01T22:30:00-03:00', '2026-12-02'],
    ['2027-01-05T08:00:00.000Z', '2027-01-05'],
  ])('%s -> %s (TS-1..4)', (iso, expected) => {
    expect(today(new Date(iso))).toBe(expected);
  });
});

describe('challengeNumber', () => {
  it.each([
    ['2026-12-01', '2026-11-24', 8],
    ['2026-11-24', '2026-11-24', 1],
    ['2026-11-23', '2026-11-24', null],
    ['2025-01-01', '2026-11-24', null],
    ['2027-01-01', '2026-11-24', 39],
    ['2028-03-01', '2028-02-28', 3],
  ])('%s vs %s -> %s (TS-5..10)', (day, launch, expected) => {
    expect(challengeNumber(day, launch)).toBe(expected);
  });

  it('composes with today (TS-11)', () => {
    expect(challengeNumber(today(new Date('2026-12-01T15:00:00.000Z')), '2026-11-24')).toBe(8);
  });

  it('returns number | null (TS-26)', () => {
    expectTypeOf(challengeNumber).returns.toEqualTypeOf<number | null>();
  });
});

describe('nextResetAt', () => {
  it.each([
    ['2026-12-01T13:45:30.250Z', '2026-12-02T00:00:00.000Z'],
    ['2026-12-02T00:00:00.000Z', '2026-12-03T00:00:00.000Z'],
    ['2026-12-31T23:59:59.999Z', '2027-01-01T00:00:00.000Z'],
  ])('%s -> %s (TS-12..14)', (iso, expected) => {
    expect(nextResetAt(new Date(iso)).toISOString()).toBe(expected);
  });

  it('returns a Date (TS-15)', () => {
    expect(nextResetAt(new Date('2026-12-01T10:00:00.000Z'))).toBeInstanceOf(Date);
    expectTypeOf(nextResetAt).returns.toEqualTypeOf<Date>();
  });
});

describe('secondsToReset', () => {
  it.each([
    ['2026-12-01T13:45:30.000Z', 36870],
    ['2026-12-01T23:59:00.000Z', 60],
    ['2026-12-02T00:00:00.000Z', 86400],
    ['2026-12-01T23:59:59.500Z', 1],
  ])('%s -> %i (TS-16..19)', (iso, expected) => {
    expect(secondsToReset(new Date(iso))).toBe(expected);
  });

  it.each([
    ['2026-12-01T00:00:00.001Z', 86400],
    ['2026-12-01T12:00:00.000Z', 43200],
    ['2026-12-01T23:59:59.999Z', 1],
  ])('is integer >= 0 and consistent with nextResetAt for %s (TS-20)', (iso, expected) => {
    const now = new Date(iso);
    const r = secondsToReset(now);
    expect(Number.isInteger(r)).toBe(true);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBe(Math.ceil((nextResetAt(now).getTime() - now.getTime()) / 1000));
    expect(r).toBe(expected);
  });
});

describe('purity', () => {
  it('does not read the system clock nor mutate input (TS-21)', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-06-15T12:00:00Z'));
    const now = new Date('2026-12-01T10:00:00.000Z');
    expect(today(now)).toBe('2026-12-01');
    expect(nextResetAt(now).toISOString()).toBe('2026-12-02T00:00:00.000Z');
    expect(secondsToReset(now)).toBe(50400);
    expect(now.toISOString()).toBe('2026-12-01T10:00:00.000Z');
  });
});

describe('validateMetricsRange (S-052)', () => {
  it.each([
    ['default 30-day range (TS-13)', '2026-11-02', '2026-12-01', '2026-12-01', 'ok'],
    ['a single day (TS-14)', '2026-12-01', '2026-12-01', '2026-12-01', 'ok'],
    ['from after to (TS-15)', '2026-11-20', '2026-11-10', '2026-12-01', 'from_after_to'],
    ['to in the future (TS-16)', '2026-11-20', '2026-12-02', '2026-12-01', 'future'],
    ['366 days inclusive (TS-17)', '2025-12-01', '2026-12-01', '2026-12-01', 'ok'],
    ['367 days (TS-18)', '2025-11-30', '2026-12-01', '2026-12-01', 'too_long'],
    ['leap year, 365 day difference (TS-19)', '2027-03-01', '2028-02-29', '2028-03-01', 'ok'],
    ['leap year, 366 day difference (TS-19)', '2027-02-28', '2028-02-29', '2028-03-01', 'too_long'],
    [
      'from_after_to wins over future (TS-20)',
      '2026-12-10',
      '2026-12-05',
      '2026-12-01',
      'from_after_to',
    ],
    ['future wins over too_long (TS-20)', '2025-01-01', '2026-12-31', '2026-12-01', 'future'],
    [
      'from_after_to with future dates (TS-20)',
      '2026-12-05',
      '2026-12-03',
      '2026-12-01',
      'from_after_to',
    ],
  ] as const)('%s', (_name, from, to, day, expected) => {
    expect(validateMetricsRange(from, to, day)).toBe(expected);
  });

  it('uses the given today, not the system clock (TS-21)', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-06-15T12:00:00Z'));
    expect(validateMetricsRange('2026-11-02', '2026-12-01', '2026-12-01')).toBe('ok');
    expect(validateMetricsRange('2026-11-20', '2026-12-02', '2026-12-01')).toBe('future');
  });

  it('has the documented signature and types (TS-22)', () => {
    expectTypeOf(validateMetricsRange).toEqualTypeOf<
      (from: string, to: string, today: string) => MetricsRangeResult
    >();
    expectTypeOf<MetricsRangeReason>().toEqualTypeOf<'from_after_to' | 'future' | 'too_long'>();
    expectTypeOf<MetricsRangeResult>().toEqualTypeOf<'ok' | MetricsRangeReason>();
    // @ts-expect-error 'empty' is resolved by the admin, not a core reason
    const reason: MetricsRangeReason = 'empty';
    expect(reason).toBe('empty');
  });
});
