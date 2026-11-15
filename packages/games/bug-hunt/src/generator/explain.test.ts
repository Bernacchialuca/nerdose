import { createTreeBuilder } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { TEMPLATES } from './catalog';
import { buildExplanation } from './explain';
import { mutationsOf } from './mutation/candidates';
import { BUG_TYPES } from '@nerdose/core';

describe('buildExplanation (TS-23)', () => {
  it('builds the three steps of maxIndex with relax_comparison', () => {
    const { steps } = buildExplanation({
      operator: 'relax_comparison',
      role: {
        es: 'la condición que decide si best cambia',
        en: 'the condition that decides whether best changes',
      },
      from: '>',
      to: '>=',
      functionName: 'maxIndex',
      failing: { input: [[5, 1, 5]], expected: 0, actual: 2 },
    });
    expect(steps).toEqual([
      {
        es: 'La condición que decide si best cambia usa >= en lugar de >: con valores iguales también se cumple.',
        en: 'The condition that decides whether best changes uses >= instead of >: it also holds when the values are equal.',
      },
      {
        es: 'Con maxIndex([5, 1, 5]) devuelve 2 en lugar de 0.',
        en: 'With maxIndex([5, 1, 5]) it returns 2 instead of 0.',
      },
      {
        es: 'Los tests visibles no pasan por ese caso, por eso dan bien. El fix: volver a >.',
        en: 'The visible tests never hit that case, so they pass. The fix: go back to >.',
      },
    ]);
  });
});

describe('explanations never quote a language token (TS-24)', () => {
  const FORBIDDEN = ['===', '!==', '.length', 'len(', 'half(', '==', '!=', '{', '}'];

  it('holds for every candidate of every combination', () => {
    for (const t of TEMPLATES) {
      for (const p of t.combos) {
        const built = t.build(p, createTreeBuilder());
        for (const type of BUG_TYPES) {
          for (const c of mutationsOf(built, type)) {
            const { steps } = buildExplanation({
              operator: c.operator,
              role: c.site.role,
              from: c.from,
              to: c.to,
              functionName: t.functionName(p),
              failing: { input: [[1]], expected: 0, actual: 1 },
            });
            expect(steps).toHaveLength(3);
            for (const step of steps) {
              expect(step.es.length).toBeGreaterThan(0);
              expect(step.en.length).toBeGreaterThan(0);
              for (const token of FORBIDDEN) {
                expect(step.es.includes(token), `${t.id} ${c.operator} ${step.es}`).toBe(false);
                expect(step.en.includes(token), `${t.id} ${c.operator} ${step.en}`).toBe(false);
              }
            }
          }
        }
      }
    }
  });

  it('describes the equality fix with words', () => {
    const { steps } = buildExplanation({
      operator: 'negate_condition',
      role: { es: 'la condición que detecta algo', en: 'the condition that spots something' },
      from: '==',
      to: '!=',
      functionName: 'f',
      failing: { input: [[1]], expected: 0, actual: 1 },
    });
    expect(steps[2]?.es).toContain('El fix: volver a comparar por igualdad.');
    expect(steps[2]?.en).toContain('compare for equality again');
  });
});
