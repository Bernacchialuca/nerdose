import type { GeneratorHistory } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import type { DevdlePayload } from '../definition';
import { generator } from './index';
import type { DevdleTerm } from './index';
import { LAUNCH_DAYS } from './launch-terms';
import { verifyPayload } from './verify';
import { BANK, T_OAUTH, T_REACT, T_REDIS, T_ROUTER, payloadFrom } from './test-fixtures';

const h: GeneratorHistory<DevdlePayload, DevdleTerm> = { bankItems: BANK, recentChallenges: [] };
const p = payloadFrom(T_REACT);
const verify = (payload: DevdlePayload, history = h) => verifyPayload(payload, history);

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
        { name: 'not_excluded', ok: true },
        { name: 'launch_pool', ok: true },
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

  it('accepts a recent category when no other category has terms left', () => {
    // Solo queda REACT reutilizable: la rotación cede antes que dejar el día sin palabra.
    const log = verify(p, {
      bankItems: [T_REACT, T_REDIS],
      recentChallenges: [
        { date: '2026-12-01', payload: { ...p, category: 'programming_languages' } },
      ],
    });
    expect(log.ok).toBe(true);
  });

  it('prefers a category other than yesterday when the 3-day rule has no candidates', () => {
    const recent = [
      {
        date: '2026-11-30',
        payload: { ...payloadFrom(T_ROUTER), category: 'networking' as const },
      },
      { date: '2026-12-01', payload: { ...p, category: 'programming_languages' as const } },
    ];
    const bank = [T_REACT, T_ROUTER];
    // ROUTER (networking, hace 2 días) gana sobre REACT (lenguajes, ayer).
    expect(verify(payloadFrom(T_ROUTER), { bankItems: bank, recentChallenges: recent }).ok).toBe(
      true,
    );
    expect(verify(p, { bankItems: bank, recentChallenges: recent }).reason).toBe(
      'category_rotation',
    );
  });

  it('rejects a term excluded from Devdle', () => {
    const niche = { ...T_ROUTER, id: '77777777-7777-4777-8777-777777777777', term: 'MALBOLGE' };
    const log = verify(payloadFrom(niche), { bankItems: [niche], recentChallenges: [] });
    expect(log.ok).toBe(false);
    expect(log.reason).toBe('not_excluded');
  });

  it('rejects a non-launch term in the launch window while launch terms remain', () => {
    const log = verifyPayload(payloadFrom(T_ROUTER), h, { number: LAUNCH_DAYS });
    expect(log.ok).toBe(false);
    expect(log.reason).toBe('launch_pool');
    expect(log.checks.find((c) => c.name === 'launch_pool')?.detail).toBe(
      `ROUTER is not a launch term (challenge #${LAUNCH_DAYS})`,
    );
    expect(verifyPayload(p, h, { number: 1 }).ok).toBe(true);
  });

  it('accepts any term after the launch window or when no launch term is reusable', () => {
    const router = payloadFrom(T_ROUTER);
    expect(verifyPayload(router, h, { number: LAUNCH_DAYS + 1 }).ok).toBe(true);
    expect(verifyPayload(router, h).ok).toBe(true);
    const noLaunchLeft = { bankItems: [T_REDIS, T_ROUTER], recentChallenges: [] };
    expect(verifyPayload(router, noLaunchLeft, { number: 1 }).ok).toBe(true);
  });

  it('applies the category rotation inside the launch terms', () => {
    // Fuera del tramo ROUTER (networking) evitaría la categoría de ayer; en el tramo solo hay REACT.
    const recentLangs = [
      { date: '2026-12-01', payload: { ...p, category: 'programming_languages' as const } },
    ];
    const history = { bankItems: BANK, recentChallenges: recentLangs };
    expect(verifyPayload(p, history).reason).toBe('category_rotation');
    expect(verifyPayload(p, history, { number: 1 }).ok).toBe(true);
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
      'not_excluded',
      'launch_pool',
    ]);
    expect(log.reason).toBe('word_shape');
  });

  it('generator.verify is verifyPayload and works under await (S-042 TS-4)', async () => {
    expect(generator.verify).toBe(verifyPayload);
    const history = { bankItems: [T_REACT, T_REDIS], recentChallenges: [] };
    const log = await generator.verify(p, history);
    expect(log).toEqual(verify(p, history));
    expect(log.ok).toBe(true);
  });
});
