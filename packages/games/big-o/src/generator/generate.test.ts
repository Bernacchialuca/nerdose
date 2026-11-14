import { describe, expect, it } from 'vitest';

import { payloadSchema } from '../definition';
import { PAYLOAD } from '../definition/test-fixtures';

import { RECIPES } from './catalog/recipes';
import { addDays } from './days';
import { buildPayload, generate, historySpec, TRAP_RATE, usedBankItems } from './generate';
import { measureCode } from './shape';
import { D, recent as r, recipe, seed } from './test-fixtures';
import { eligibleRecipes } from './variety';

type Recent = ReturnType<typeof r>[];
const empty = { bankItems: [], recentChallenges: [] as Recent };
const on = (history: Recent) => ({ bankItems: [], recentChallenges: history });
const SEEDS = (n: number) => Array.from({ length: n }, (_, i) => seed(i + 1));

describe('historySpec and usedBankItems', () => {
  it('declares the window and no bank (TS-22)', () => {
    expect(historySpec).toEqual({ bank: null, lastUsedField: '', recentDays: 30, aheadDays: 30 });
    expect(usedBankItems()).toEqual([]);
    expect(TRAP_RATE).toBe(0.35);
  });
});

describe('generate', () => {
  it('never repeats a recipe used 10 days before or ahead (TS-24)', () => {
    const history = on([r('2027-03-05', 'nest(linear,doubling)')]);
    expect(eligibleRecipes(D, history.recentChallenges).map((x) => x.id)).not.toContain(
      'nest(linear,doubling)',
    );
    for (const s of SEEDS(300)) {
      expect(generate({ date: D, seed: s, history }).recipe).not.toBe('nest(linear,doubling)');
      expect(
        generate({ date: D, seed: s, history: on([r('2027-03-25', 'nest(linear,doubling)')]) }).recipe,
      ).not.toBe('nest(linear,doubling)');
    }
    const seen = (h: typeof empty) =>
      SEEDS(300).some((s) => generate({ date: D, seed: s, history: h }).recipe === 'nest(linear,doubling)');
    expect(seen(empty)).toBe(true);
    expect(seen(on([r('2027-02-13', 'nest(linear,doubling)')]))).toBe(true);
  });

  it('never repeats an answer 3 days in a row (TS-25)', () => {
    const variants = [
      [r('2027-03-14', 'linear'), r('2027-03-13', 'seq(linear,linear)')],
      [r('2027-03-16', 'linear'), r('2027-03-17', 'seq(linear,linear)')],
      [r('2027-03-14', 'linear'), r('2027-03-16', 'seq(linear,linear)')],
    ];
    for (const h of variants) {
      for (const s of SEEDS(300)) {
        expect(generate({ date: D, seed: s, history: on(h) }).answer).not.toBe('o_n');
      }
    }
    expect(
      SEEDS(300).some((s) => generate({ date: D, seed: s, history: on([r('2027-03-14', 'linear')]) }).answer === 'o_n'),
    ).toBe(true);
  });

  it('is deterministic and does not mutate the history (TS-26)', () => {
    const h = on([1, 2, 3, 4, 5].map((i) => r(`2027-03-${String(15 - i).padStart(2, '0')}`, RECIPES[i * 3]!.id)));
    const h0 = structuredClone(h);
    const recipes = new Set<string>();
    for (let k = 1; k <= 2000; k++) {
      const a = generate({ date: D, seed: seed(k), history: h });
      const b = generate({ date: D, seed: seed(k), history: structuredClone(h0) });
      expect(a).toEqual(b);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      recipes.add(a.recipe);
    }
    expect(h).toEqual(h0);
    expect(recipes.size).toBeGreaterThanOrEqual(30);
  });

  it('draws traps at the declared rate and always a valid payload (TS-27)', () => {
    const seen = new Set<string>();
    let traps = 0;
    for (let k = 1; k <= 2000; k++) {
      const p = generate({ date: D, seed: seed(k), history: empty });
      expect(() => payloadSchema.parse(p)).not.toThrow();
      if (p.trap_option !== null) traps++;
      seen.add(p.recipe);
      const rec = recipe(p.recipe);
      expect([p.answer, p.recipe_category, p.trap_option]).toEqual([rec.answer, rec.category, rec.trapOption]);
      for (const lang of ['js', 'go', 'java'] as const) {
        const m = measureCode(p.code[lang], lang);
        expect(m.lines).toBeLessThanOrEqual(15);
        expect(m.nesting).toBeLessThanOrEqual(3);
      }
    }
    expect(traps / 2000).toBeGreaterThanOrEqual(0.25);
    expect(traps / 2000).toBeLessThanOrEqual(0.45);
    expect(seen.size).toBe(RECIPES.length);
  });

  it('falls back to the other group and to the whole catalog (TS-28)', () => {
    const trap = RECIPES.filter((x) => x.trap !== null);
    const plain = RECIPES.filter((x) => x.trap === null);
    const day = (offset: number) => addDays(D, offset);
    const usedTrap = on(trap.map((x, i) => r(day(-(i + 1)), x.id)));
    const usedPlain = on(plain.map((x, i) => r(day(-(i + 1)), x.id)));
    for (const s of SEEDS(300)) {
      expect(generate({ date: D, seed: s, history: usedTrap }).trap_option).toBeNull();
      expect(generate({ date: D, seed: s, history: usedPlain }).trap_option).not.toBeNull();
    }
    const offsets = Array.from({ length: 58 }, (_, i) => (i < 29 ? i - 29 : i - 28));
    const spread = RECIPES.map((x, i) => r(addDays(D, offsets[i] as number), x.id));
    expect(eligibleRecipes(D, spread)).toEqual([]);
    for (const s of SEEDS(50)) {
      const p = generate({ date: D, seed: s, history: on(spread) });
      expect(() => payloadSchema.parse(p)).not.toThrow();
      expect(RECIPES.some((x) => x.id === p.recipe)).toBe(true);
      expect(generate({ date: D, seed: s, history: on(spread) })).toEqual(p);
    }
  });
});

describe('buildPayload', () => {
  it('matches the reference payload of the definition on its shape', () => {
    const p = buildPayload(recipe('nest(linear,doubling)'), [1]);
    expect(p.code).toEqual(PAYLOAD.code);
  });
});
