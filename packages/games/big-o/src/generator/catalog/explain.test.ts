import type { Stmt } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { CODE_NLOGN, PAYLOAD } from '../../definition/test-fixtures';
import { payloadSchema } from '../../definition';
import { OPTION_LABEL } from '../../shared/labels';
import { buildPayload } from '../generate';
import { classValue, EXAMPLE_N } from '../scale';
import { recipe } from '../test-fixtures';

import { buildRecipe } from './build';
import { paramCombos } from './params';
import { RECIPES } from './recipes';

const lineHolders = (body: readonly Stmt[], lineOf: Record<string, number>, out: Set<number>) => {
  const hasCall = (s: Stmt): boolean => JSON.stringify(s).includes('"kind":"call"');
  for (const s of body) {
    if (s.kind === 'for' || s.kind === 'while') {
      out.add(lineOf[s.id] as number);
      lineHolders(s.body, lineOf, out);
    } else if (s.kind === 'if') {
      lineHolders(s.then, lineOf, out);
    } else if (hasCall(s)) {
      out.add(lineOf[s.id] as number);
    }
  }
};

describe('buildPayload', () => {
  it('explains the double recursion and adds the phi step (TS-18)', () => {
    const p = buildPayload(recipe('double_recursion(n-1,n-2)'), []);
    expect(p).toMatchObject({ answer: 'o_2n', recipe_category: 'recursion', trap_option: null });
    expect(p.explanation.steps).toContainEqual({
      es: 'La cota exacta es φⁿ ≈ 1,618ⁿ, que está dentro de O(2ⁿ).',
      en: 'The tight bound is φⁿ ≈ 1.618ⁿ, which is within O(2ⁿ).',
    });
    expect(p.explanation.steps.at(-1)).toEqual({
      es: 'Descartamos constantes y términos menores: O(2ⁿ).',
      en: 'We drop constants and lower-order terms: O(2ⁿ).',
    });
    expect(p.explanation.example).toEqual({ n: 20, ops: 10946, trap_ops: null });
    expect(p.explanation.line_notes).toContainEqual({
      line: 5,
      text: { es: 'dos llamadas por nivel', en: 'two calls per level' },
    });
    expect(p.code.js).toContain('return f(n - 1) + f(n - 2);');
  });

  it('builds a valid, structured explanation for the whole catalog (TS-19)', () => {
    for (const r of RECIPES) {
      for (const params of paramCombos(r)) {
        const label = `${r.id} ${params.join(',')}`;
        const built = buildRecipe(r, params);
        const p = buildPayload(r, params);
        expect(() => payloadSchema.parse(p), label).not.toThrow();
        const { steps, line_notes, tip, example } = p.explanation;
        expect(steps.length).toBeGreaterThanOrEqual(2);
        expect(steps.length).toBeLessThanOrEqual(6);
        for (const s of steps) {
          expect(s.es.length).toBeGreaterThan(0);
          expect(s.en.length).toBeGreaterThan(0);
          expect(s.es, label).not.toBe(s.en);
        }
        expect(new Set(steps.map((s) => s.es)).size, label).toBe(steps.length);
        const last = steps.at(-1);
        expect(last?.es).toContain(OPTION_LABEL[r.answer]);
        expect(last?.en).toContain(OPTION_LABEL[r.answer]);

        const holders = new Set<number>();
        lineHolders(built.func.body, built.lineOf, holders);
        expect(line_notes.length, label).toBeGreaterThanOrEqual(1);
        const lines = line_notes.map((l) => l.line);
        expect(lines, label).toEqual([...new Set(lines)].sort((a, b) => a - b));
        for (const note of line_notes) {
          expect(holders.has(note.line), `${label} line ${note.line}`).toBe(true);
          expect(note.text.es.length).toBeGreaterThan(0);
          expect(note.text.en.length).toBeGreaterThan(0);
        }

        expect(tip).not.toBeNull();
        expect(tip?.es.length).toBeGreaterThan(0);
        expect(tip?.en.length).toBeGreaterThan(0);
        if (r.trapOption !== null) {
          expect(tip?.es).toContain(OPTION_LABEL[r.trapOption]);
          expect(tip?.en).toContain(OPTION_LABEL[r.trapOption]);
        }
        const n = EXAMPLE_N[r.answer];
        expect(example).toEqual({
          n,
          ops: built.cost(n),
          trap_ops: r.trapOption ? classValue(r.trapOption, n) : null,
        });
      }
    }
  });

  it('writes the golden explanation of nest(linear,doubling) (TS-20)', () => {
    const p = buildPayload(recipe('nest(linear,doubling)'), [1]);
    expect(p.explanation.steps).toEqual([
      { es: 'El loop de la línea 3 corre n veces.', en: 'The loop on line 3 runs n times.' },
      {
        es: 'El loop de la línea 4 duplica su variable: log₂ n vueltas.',
        en: 'The loop on line 4 doubles its variable: log₂ n iterations.',
      },
      {
        es: 'Están anidados: se multiplican, n × log n.',
        en: 'They are nested, so they multiply: n × log n.',
      },
      {
        es: 'Descartamos constantes y términos menores: O(n log n).',
        en: 'We drop constants and lower-order terms: O(n log n).',
      },
    ]);
    expect(p.explanation.line_notes).toEqual([
      { line: 3, text: { es: 'n veces', en: 'n times' } },
      { line: 4, text: { es: 'log n veces', en: 'log n times' } },
    ]);
    expect(
      p.explanation.tip?.es.startsWith(
        'La trampa más común es ver dos loops anidados y responder O(n²)',
      ),
    ).toBe(true);
    expect(p.explanation.example).toEqual({ n: 1024, ops: 10240, trap_ops: 1048576 });
    expect(p).toMatchObject({ trap_option: 'o_n2', recipe_category: 'nested_loops' });
    expect(p.code).toEqual(CODE_NLOGN);
    expect(p.explanation.example).toEqual(PAYLOAD.explanation.example);
    expect(Object.keys(p)).toEqual(Object.keys(PAYLOAD));
  });

  it('picks the tip by trap kind or by category (TS-21)', () => {
    const seqPayload = buildPayload(recipe('seq(linear,linear)'), [1, 1]);
    expect(seqPayload.explanation.tip).toEqual({
      es: 'La trampa más común es ver varios loops y responder O(n²): uno después del otro se suman, no se multiplican.',
      en: "The most common trap is to see several loops and answer O(n²): one after the other they add up, they don't multiply.",
    });
    expect(seqPayload.explanation.example).toEqual({ n: 1024, ops: 2048, trap_ops: 1048576 });

    const constant = buildPayload(recipe('nest(linear,constant)'), [1, 100]);
    expect(constant.explanation.tip?.es).toContain('por grande que sea la constante');
    expect(constant.explanation.tip?.es).toContain('O(n²)');
    expect(constant.explanation.example).toEqual({ n: 1024, ops: 102400, trap_ops: 1048576 });

    const plain = buildPayload(recipe('linear'), [1]);
    expect(plain.trap_option).toBeNull();
    expect(plain.explanation.tip?.es).toContain('Para un loop, preguntate');
    expect(plain.explanation.example).toEqual({ n: 1024, ops: 1024, trap_ops: null });
  });
});
