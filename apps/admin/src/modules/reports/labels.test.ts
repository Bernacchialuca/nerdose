import { describe, expect, it } from 'vitest';

import { challengeLabel, parseStatusParam, reasonsSummary } from './labels';

describe('labels', () => {
  it('reasonsSummary ordena por cantidad y desempata por REPORT_REASONS (TS-67)', () => {
    expect(reasonsSummary({ ambiguous: 1, translation: 1 })).toBe('Ambiguo ×1, Traducción ×1');
    expect(reasonsSummary({ translation: 2, ambiguous: 3 })).toBe('Ambiguo ×3, Traducción ×2');
  });

  it('challengeLabel', () => {
    expect(challengeLabel({ game_id: 'devdle', number: 8 })).toBe('Devdle #8');
    expect(challengeLabel({ game_id: 'timeline', number: 7 })).toBe('Tech Timeline #7');
  });

  it('parseStatusParam trata ausente o inválido como open (TS-27)', () => {
    expect(parseStatusParam(null)).toBe('open');
    expect(parseStatusParam('foo')).toBe('open');
    expect(parseStatusParam('dismissed')).toBe('dismissed');
  });
});
