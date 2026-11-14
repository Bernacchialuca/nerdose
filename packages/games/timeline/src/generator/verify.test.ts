/* eslint-disable @typescript-eslint/no-explicit-any -- mutaciones deliberadas de payloads malformados */
import { describe, expect, it } from 'vitest';

import type { TimelinePayload } from '../definition';
import { CORRECT, ID, OID, PAYLOAD } from '../definition/test-fixtures';
import { generator } from './index';
import { BANK_FIXTURE, history } from './test-fixtures';
import { verifyPayload } from './verify';

const H = history(BANK_FIXTURE);
const mutate = (fn: (p: any) => void): TimelinePayload => {
  const p = structuredClone(PAYLOAD) as any;
  fn(p);
  return p;
};
const verify = (p: TimelinePayload, h = H) => verifyPayload(p, h);
const NAMES = [
  'items_count',
  'facts_in_bank',
  'item_category',
  'texts_bilingual',
  'distinguishable',
  'correct_order_consistent',
  'opaque_ids',
  'shuffled',
  'not_used_90',
];

describe('verifyPayload', () => {
  it('accepts the fixture with the 9 checks in order (TS-56)', () => {
    const v = verify(PAYLOAD);
    expect(v.ok).toBe(true);
    expect(v.reason).toBeUndefined();
    expect(v.checks.map((c) => c.name)).toEqual(NAMES);
    expect(v.checks.every((c) => c.ok)).toBe(true);
  });

  it('items_count (TS-57)', () => {
    expect(verify(mutate((p) => (p.items[1].fact_id = ID.GO))).reason).toBe('items_count');
  });

  it('facts_in_bank (TS-58)', () => {
    for (const fn of [
      (p: any) => (p.items[0].label = 'Golang'),
      (p: any) => (p.items[0].fact_id = '99999999-0000-4000-8000-000000000000'),
      (p: any) => (p.items[1].date_precision = 'year'),
    ]) {
      expect(verify(mutate(fn)).reason).toBe('facts_in_bank');
    }
  });

  it('item_category: each item carries the category of its fact (TS-59)', () => {
    expect(verify(mutate((p) => (p.items[0].category = 'internet'))).reason).toBe('item_category');
    expect(verify(mutate((p) => (p.items[0].category = 'frameworks'))).reason).toBe(
      'item_category',
    );
    const bank = BANK_FIXTURE.map((f) =>
      f.id === ID.DOCKER ? { ...f, category: 'companies' as const } : f,
    );
    expect(verify(PAYLOAD, history(bank)).reason).toBe('item_category');
  });

  it('accepts a payload that mixes categories (TS-59b)', () => {
    expect(new Set(PAYLOAD.items.map((i) => i.category)).size).toBeGreaterThan(1);
    expect(verify(PAYLOAD).ok).toBe(true);
  });

  it('texts_bilingual (TS-60)', () => {
    expect(verify(mutate((p) => (p.items[0].note.en = ''))).reason).toBe('texts_bilingual');
    expect(verify(mutate((p) => (p.prompt.es = '   '))).reason).toBe('texts_bilingual');
  });

  it('correct_order_consistent (TS-61)', () => {
    expect(
      verify(mutate((p) => (p.correct_order = ['j4x8q1', 'p7k2m9', 'g2n5w3', 'd9r6t0', 'k1v3s8'])))
        .reason,
    ).toBe('correct_order_consistent');
    expect(verify(mutate((p) => (p.correct_order[4] = 'zzzzzz'))).reason).toBe(
      'correct_order_consistent',
    );
  });

  it('opaque_ids (TS-62)', () => {
    expect(
      verify(
        mutate((p) => {
          for (const i of p.items) if (i.opaque_id === OID.PYTHON) i.opaque_id = 'p7k2m';
          p.correct_order[0] = 'p7k2m';
        }),
      ).reason,
    ).toBe('opaque_ids');
    const alpha = ['a00001', 'b00002', 'c00003', 'd00004', 'e00005'];
    expect(
      verify(
        mutate((p) => {
          p.items = p.items.map((i: any) => ({
            ...i,
            opaque_id: alpha[CORRECT.indexOf(i.opaque_id)],
          }));
          p.correct_order = alpha;
        }),
      ).reason,
    ).toBe('opaque_ids');
  });

  it('shuffled (TS-63)', () => {
    expect(
      verify(
        mutate((p) => {
          p.items = CORRECT.map((id) => p.items.find((i: any) => i.opaque_id === id));
        }),
      ).reason,
    ).toBe('shuffled');
  });

  it('not_used_90 by last_used, exact limit passes (TS-64)', () => {
    const withJava = (last: string) =>
      history(BANK_FIXTURE.map((f) => (f.id === ID.JAVA ? { ...f, last_used: last } : f)));
    const v = verify(PAYLOAD, withJava('2026-09-04'));
    expect(v.reason).toBe('not_used_90');
    expect(v.checks.find((c) => c.name === 'not_used_90')?.detail).toContain('Java');
    expect(verify(PAYLOAD, withJava('2026-09-03')).ok).toBe(true);
  });

  it('not_used_90 by recent challenge (TS-65)', () => {
    const h = history(BANK_FIXTURE, [{ date: '2026-11-30', payload: PAYLOAD }]);
    expect(verify(PAYLOAD, h).reason).toBe('not_used_90');
  });

  it('reason is the first failed check (TS-66)', () => {
    const v = verify(
      mutate((p) => {
        p.items = CORRECT.map((id) => p.items.find((i: any) => i.opaque_id === id));
        p.items[0].note.es = '';
      }),
    );
    expect(v.reason).toBe('texts_bilingual');
    expect(v.checks.find((c) => c.name === 'shuffled')?.ok).toBe(false);
  });

  it('never throws on malformed payloads (TS-67)', () => {
    const a = verify({ ...PAYLOAD, items: null } as never);
    const b = verify({ ...PAYLOAD, correct_order: undefined } as never);
    expect(a.reason).toBe('items_count');
    expect(b.reason).toBe('correct_order_consistent');
    expect(a.checks).toHaveLength(9);
    expect(b.checks).toHaveLength(9);
  });

  it('generator.verify is verifyPayload and works under await (S-042 TS-16)', async () => {
    expect(generator.verify).toBe(verifyPayload);
    const v = await generator.verify(PAYLOAD, history(BANK_FIXTURE));
    expect(v.ok).toBe(true);
    expect(v.reason).toBeUndefined();
    expect(v.checks.map((c) => c.name)).toEqual(NAMES);
  });
});
