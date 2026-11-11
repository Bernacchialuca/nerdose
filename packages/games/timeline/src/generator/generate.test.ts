import { describe, expect, it } from 'vitest';

import { payloadSchema, type TimelinePayload } from '../definition';
import { PAYLOAD } from '../definition/test-fixtures';
import { PROMPTS } from '../shared/prompts';
import { generator } from './index';
import { BANK, BANK_TIGHT, BID, DATE, ID, history, mk, seed } from './test-fixtures';

const gen = (n: number, date = DATE, bank = BANK): TimelinePayload =>
  generator.generate({ date, seed: seed(n), history: history(bank) });
const factIds = (p: TimelinePayload) => p.items.map((i) => i.fact_id);
const range = (n: number) => Array.from({ length: n }, (_, k) => k + 1);

describe('generator.generate', () => {
  it('declares its history spec and used bank items (TS-40)', () => {
    expect(generator.historySpec).toEqual({
      bank: 'timeline_facts',
      lastUsedField: 'last_used',
      recentDays: 90,
    });
    expect(generator.usedBankItems(PAYLOAD)).toEqual([
      ID.GO,
      ID.KUBERNETES,
      ID.PYTHON,
      ID.DOCKER,
      ID.JAVA,
    ]);
  });

  it('never picks Java, Rust or Swift on 2026-12-10 (TS-43)', () => {
    for (const n of range(50)) {
      const p = gen(n);
      for (const nn of ['02', '05', '08']) expect(factIds(p)).not.toContain(BID(nn));
      expect(p.category).toBe('programming_languages');
    }
  });

  it('Java is eligible again on 2027-02-20 (TS-44)', () => {
    const ps = range(50).map((n) => gen(n, '2027-02-20'));
    expect(ps.some((p) => factIds(p).includes(BID('02')))).toBe(true);
    expect(ps.every((p) => !factIds(p).includes(BID('05')))).toBe(true);
  });

  it('candidates are valid and never mix Go with Node.js (TS-45)', () => {
    for (const n of range(50)) {
      const p = payloadSchema.parse(gen(n));
      expect(generator.verify(p, history(BANK)).ok).toBe(true);
      const ids = factIds(p);
      expect(ids.includes(BID('03')) && ids.includes(BID('04'))).toBe(false);
      expect(new Set(ids).size).toBe(5);
    }
  });

  it('builds a consistent payload (TS-46)', () => {
    const p = gen(1);
    expect(p.date).toBe(DATE);
    expect(p.prompt).toEqual(PROMPTS.programming_languages);
    expect(p.items).toHaveLength(5);
    for (const i of p.items) {
      const f = BANK.find((b) => b.id === i.fact_id)!;
      expect([i.label, i.event_date, i.date_precision, i.note]).toEqual([
        f.label,
        f.event_date,
        f.date_precision,
        f.note,
      ]);
    }
    const chrono = [...p.items].sort((a, b) => (a.event_date < b.event_date ? -1 : 1));
    expect(p.correct_order).toEqual(chrono.map((i) => i.opaque_id));
  });

  it('draws opaque ids from the seed (TS-47)', () => {
    const p = gen(1);
    const ids = p.items.map((i) => i.opaque_id);
    expect(new Set(ids).size).toBe(5);
    expect(ids.every((id) => /^[a-z0-9]{6}$/.test(id))).toBe(true);
    expect([...ids].sort()).not.toEqual(p.correct_order);
    expect(ids).not.toEqual(p.correct_order);
    for (const i of p.items) expect(i.fact_id.includes(i.opaque_id)).toBe(false);
  });

  it('the same fact gets different ids in different challenges (TS-48)', () => {
    const p1 = gen(1);
    const p2 = gen(2);
    for (const a of p1.items) {
      const b = p2.items.find((x) => x.fact_id === a.fact_id);
      if (b) expect(b.opaque_id).not.toBe(a.opaque_id);
    }
  });

  it('is deterministic (TS-49)', () => {
    expect(gen(7)).toEqual(gen(7));
    expect(gen(7)).not.toEqual(gen(8));
  });

  it('does not mutate its inputs (TS-50)', () => {
    const bank = structuredClone(BANK);
    gen(3, DATE, bank);
    expect(bank).toEqual(BANK);
  });

  it('always reshuffles and redraws away from the answer (TS-51)', () => {
    for (const n of range(200)) {
      const p = gen(n);
      const ids = p.items.map((i) => i.opaque_id);
      expect([...ids].sort()).not.toEqual(p.correct_order);
      expect(ids).not.toEqual(p.correct_order);
    }
  });

  it('a tight bank yields an indistinguishable candidate that verify rejects (TS-52)', () => {
    const h = history(BANK_TIGHT);
    const p = payloadSchema.parse(generator.generate({ date: DATE, seed: seed(1), history: h }));
    expect(factIds(p).sort()).toEqual(BANK_TIGHT.map((f) => f.id).sort());
    const v = generator.verify(p, h);
    expect(v).toMatchObject({ ok: false, reason: 'distinguishable' });
    const detail = v.checks.find((c) => c.name === 'distinguishable')?.detail ?? '';
    expect(detail).toContain('Go');
    expect(detail).toContain('Node.js');
  });

  it('with no eligible category it picks anyway and verify rejects (TS-53)', () => {
    const bank = BANK.map((f) =>
      f.category === 'programming_languages' ? { ...f, last_used: '2026-12-01' } : f,
    );
    const p = gen(1, DATE, bank);
    expect(p.category).toBe('programming_languages');
    expect(generator.verify(p, history(bank))).toMatchObject({ ok: false, reason: 'not_used_90' });
  });

  it('throws when no category has 5 facts (TS-54)', () => {
    const bank = BANK.filter((f) => f.category === 'frameworks');
    expect(() => gen(1, DATE, bank)).toThrow(
      new RangeError('timeline generate: no category has 5 facts'),
    );
  });

  it('picks the category from the rng among those with 5 eligible (TS-55)', () => {
    const extra = [
      mk(BID('31'), 'Apple', 'companies', '1976-04-01', 'day'),
      mk(BID('32'), 'Microsoft', 'companies', '1975-04-04', 'day'),
      mk(BID('33'), 'Google', 'companies', '1998-09-04', 'day'),
      mk(BID('34'), 'Facebook', 'companies', '2004-02-04', 'day'),
      mk(BID('35'), 'Tesla', 'companies', '2003-07-01', 'day'),
    ];
    const cats = new Set(range(50).map((n) => gen(n, DATE, [...BANK, ...extra]).category));
    expect([...cats].sort()).toEqual(['companies', 'programming_languages']);
  });

  it('completes with non-eligible facts when needed (TS-53 variant)', () => {
    const bank = BANK_TIGHT.map((f, k) => (k === 0 ? { ...f, last_used: '2026-12-01' } : f));
    const p = gen(1, DATE, bank);
    expect(p.items).toHaveLength(5);
  });
});
