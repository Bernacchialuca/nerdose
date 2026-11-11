import { describe, expect, it } from 'vitest';

import { payloadSchema, type TimelinePayload } from '../definition';
import { PAYLOAD } from '../definition/test-fixtures';
import { PROMPT } from '../shared/prompts';
import { generator } from './index';
import { BANK, BANK_TIGHT, BID, DATE, ID, history, seed } from './test-fixtures';

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
    expect(p.prompt).toEqual(PROMPT);
    expect(p).not.toHaveProperty('category');
    expect(p.items).toHaveLength(5);
    for (const i of p.items) {
      const f = BANK.find((b) => b.id === i.fact_id)!;
      expect([i.label, i.category, i.event_date, i.date_precision, i.note]).toEqual([
        f.label,
        f.category,
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

  it('with fewer than 5 eligible facts it picks anyway and verify rejects (TS-53)', () => {
    const bank = BANK.map((f) => (f.id === BID('21') ? f : { ...f, last_used: '2026-12-01' }));
    const p = gen(1, DATE, bank);
    expect(factIds(p)).toContain(BID('21'));
    expect(generator.verify(p, history(bank))).toMatchObject({ ok: false, reason: 'not_used_90' });
  });

  it('throws when the bank has fewer than 5 facts (TS-54)', () => {
    const bank = BANK.filter((f) => f.category === 'frameworks');
    expect(bank).toHaveLength(4);
    expect(() => gen(1, DATE, bank)).toThrow(
      new RangeError('timeline generate: the bank has fewer than 5 facts'),
    );
  });

  it('mixes categories: picks from the whole pool, whatever the category (TS-55)', () => {
    const ps = range(50).map((n) => gen(n));
    const mixed = ps.filter((p) => new Set(p.items.map((i) => i.category)).size > 1);
    expect(mixed.length).toBeGreaterThan(0);
    const seen = new Set(ps.flatMap((p) => p.items.map((i) => i.category)));
    expect([...seen].sort()).toEqual(['frameworks', 'programming_languages']);
    // Una categoría con menos de 5 hechos también entra: 4 frameworks + 1 lenguaje alcanzan.
    const fourAndOne = [...BANK.filter((f) => f.category === 'frameworks'), BANK[0]!];
    const p = gen(1, DATE, fourAndOne);
    expect(factIds(p).sort()).toEqual(fourAndOne.map((f) => f.id).sort());
    expect(generator.verify(p, history(fourAndOne)).ok).toBe(true);
  });

  it('completes with non-eligible facts when needed (TS-53 variant)', () => {
    const bank = BANK_TIGHT.map((f, k) => (k === 0 ? { ...f, last_used: '2026-12-01' } : f));
    const p = gen(1, DATE, bank);
    expect(p.items).toHaveLength(5);
  });
});
