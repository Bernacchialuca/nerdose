import { describe, expect, it } from 'vitest';

import { TIMELINE_REJECTION_REASONS, timelineFactItemSchema } from '../src';

import { F_OK } from './helpers';

function issuePaths(value: unknown): string[][] | null {
  const result = timelineFactItemSchema.safeParse(value);
  return result.success ? null : result.error.issues.map((i) => i.path.map(String));
}

describe('timelineFactItemSchema', () => {
  it('accepts valid approved facts per precision (TS-3)', () => {
    for (const fact of [
      F_OK,
      { ...F_OK, event_date: '2014-06-01', date_precision: 'month' },
      { ...F_OK, event_date: '1991-01-01', date_precision: 'year' },
      { ...F_OK, event_date: '2024-02-29' },
    ]) {
      expect(timelineFactItemSchema.safeParse(fact).success).toBe(true);
    }
  });

  it('rejects a rejection_reason outside the enum (TS-4)', () => {
    for (const reason of ['fecha discutida', 'invalid_chars']) {
      const paths = issuePaths({ ...F_OK, status: 'rejected', rejection_reason: reason });
      expect(paths).toContainEqual(['rejection_reason']);
    }
  });

  it('accepts the eight codes on rejected facts without note or date coherence (TS-5)', () => {
    for (const reason of TIMELINE_REJECTION_REASONS) {
      const fact = {
        ...F_OK,
        status: 'rejected',
        rejection_reason: reason,
        note: { es: '', en: '' },
        event_date: '1995-05-23',
        date_precision: 'year',
      };
      expect(timelineFactItemSchema.safeParse(fact).success, reason).toBe(true);
    }
  });

  it('requires both notes on approved facts (TS-6)', () => {
    expect(issuePaths({ ...F_OK, note: { es: '', en: 'Java is' } })).toEqual([['note', 'es']]);
    expect(issuePaths({ ...F_OK, note: { es: 'Java es', en: '   ' } })).toEqual([['note', 'en']]);
  });

  it('requires a real date coherent with the precision on approved facts (TS-7)', () => {
    for (const patch of [
      { event_date: '1991-02-20', date_precision: 'year' },
      { event_date: '2014-06-15', date_precision: 'month' },
      { event_date: '2014-02-30', date_precision: 'day' },
      { event_date: '2023-02-29' },
      { event_date: '2014-13-01', date_precision: 'month' },
    ]) {
      expect(issuePaths({ ...F_OK, ...patch }), JSON.stringify(patch)).toEqual([['event_date']]);
    }
  });

  it('validates the date format in any status (TS-8)', () => {
    expect(issuePaths({ ...F_OK, event_date: '1995-5-23' })).toContainEqual(['event_date']);
    expect(
      issuePaths({
        ...F_OK,
        status: 'rejected',
        rejection_reason: 'imprecise_date',
        event_date: '1995',
      }),
    ).toContainEqual(['event_date']);
  });

  it('keeps the status/reason coherence and strict keys (TS-9)', () => {
    expect(issuePaths({ ...F_OK, rejection_reason: 'duplicate' })).toEqual([['rejection_reason']]);
    expect(issuePaths({ ...F_OK, status: 'rejected', rejection_reason: null })).toEqual([
      ['rejection_reason'],
    ]);
    expect(timelineFactItemSchema.safeParse({ ...F_OK, extra: 1 }).success).toBe(false);
  });
});
