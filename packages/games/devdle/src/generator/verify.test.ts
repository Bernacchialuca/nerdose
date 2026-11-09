import type { GeneratorHistory } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import type { DevdlePayload } from '../definition';
import { generator } from './index';
import type { DevdleTerm } from './index';
import { BANK, T_OAUTH, T_REACT, T_REDIS, payloadFrom } from './test-fixtures';

const h: GeneratorHistory<DevdlePayload, DevdleTerm> = { bankItems: BANK, recentChallenges: [] };
const p = payloadFrom(T_REACT);
const verify = (payload: DevdlePayload, history = h) => generator.verify(payload, history);

describe('generator.verify', () => {
  it('approves a valid candidate (TS-43)', () => {
    const log = verify(p, { bankItems: [T_REACT, T_REDIS], recentChallenges: [] });
    expect(log).toEqual({
      ok: true,
      checks: [
        { name: 'word_shape', ok: true },
        { name: 'texts_bilingual', ok: true },
        { name: 'term_in_bank', ok: true },
        { name: 'not_used_365', ok: true },
        { name: 'category_rotation', ok: true },
      ],
    });
    expect(JSON.parse(JSON.stringify(log))).toEqual(log);
  });

  it('rejects a bad word shape (TS-44)', () => {
    for (const word of ['C++', 'REACT1']) {
      const log = verify({ ...p, word });
      expect(log.reason).toBe('word_shape');
      expect(log.checks[0]?.ok).toBe(false);
      expect(log.checks[0]?.detail).toBeDefined();
    }
  });

  it('rejects a missing language (TS-45)', () => {
    const bad = [
      { ...p, definition: { es: p.definition.es, en: '' } },
      { ...p, summary: { es: '   ', en: p.summary.en } },
      { ...p, summary: { en: p.summary.en } } as unknown as DevdlePayload,
    ];
    for (const b of bad) {
      const log = verify(b);
      expect(log.ok).toBe(false);
      expect(log.reason).toBe('texts_bilingual');
    }
  });

  it('rejects a term used less than 365 days ago (TS-46)', () => {
    const log = verify(payloadFrom(T_REDIS));
    expect(log.reason).toBe('not_used_365');
    expect(log.checks.find((c) => c.name === 'not_used_365')?.detail).toContain('2025-12-03');
  });

  it('rejects a term reserved for a future date (TS-47)', () => {
    const log = verify(payloadFrom(T_OAUTH));
    expect(log.ok).toBe(false);
    expect(log.reason).toBe('not_used_365');
  });

  it('rejects a repeated category (TS-48)', () => {
    const log = verify(p, {
      bankItems: BANK,
      recentChallenges: [
        { date: '2026-12-01', payload: { ...p, category: 'programming_languages' } },
      ],
    });
    expect(log.ok).toBe(false);
    expect(log.reason).toBe('category_rotation');
  });

  it('rejects unknown or inconsistent terms (TS-49)', () => {
    for (const bad of [
      { ...p, term_id: '99999999-9999-4999-8999-999999999999' },
      { ...p, word: 'REDUX' },
    ]) {
      const log = verify(bad);
      expect(log.ok).toBe(false);
      expect(log.reason).toBe('term_in_bank');
    }
  });

  it('reports every check on multiple failures (TS-50)', () => {
    const log = verify({ ...p, word: 'C++', definition: { es: '', en: '' } });
    expect(log.checks.map((c) => c.name)).toEqual([
      'word_shape',
      'texts_bilingual',
      'term_in_bank',
      'not_used_365',
      'category_rotation',
    ]);
    expect(log.reason).toBe('word_shape');
  });
});
