import { createHmac } from 'node:crypto';

import { challenges, terms } from '@nerdose/db';
import { makeChallenge } from '@nerdose/db/testing';
import { payloadSchema } from '@nerdose/game-devdle/definition';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { generateForDate, type GenerateDeps } from '@/domain/challenge-publishing/generate';
import { generatorRegistry } from '@/games/registry';

import { BANK16, insertTerms } from '../helpers/bank';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

const SECRET = 'test-secret-0123456789abcdef0123456789';
const seedHex = (date: string, attempt: number) =>
  createHmac('sha256', SECRET).update(`devdle:${date}:${attempt}`).digest('hex');

const t = setupTestDb();
const entry = generatorRegistry.get('devdle');

function setup(maxAttempts = 20, overrides: Partial<GenerateDeps> = {}) {
  const captured = captureLogger();
  const repo = new ChallengePublishingRepository(t.svc.db);
  const deps: GenerateDeps = {
    repo,
    env: {
      GENERATOR_SECRET: SECRET,
      LAUNCH_DATE: '2026-11-20',
      GENERATION_MAX_ATTEMPTS: maxAttempts,
    },
    log: captured.logger,
    signal: new AbortController().signal,
    ...overrides,
  };
  return { deps, repo, lines: captured.lines };
}

const rowsFor = (date: string) =>
  t.owner.db
    .select()
    .from(challenges)
    .where(and(eq(challenges.gameId, 'devdle'), eq(challenges.date, date)))
    .orderBy(asc(challenges.attempt));

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

describe('generateForDate', () => {
  it('aprueba un hueco con number, seed HMAC y last_used en la misma transacción', async () => {
    await insertTerms(t.owner.db, BANK16);
    const { deps } = setup();
    const result = await generateForDate({ entry, date: '2026-12-02' }, deps);
    expect(result).toEqual({ outcome: 'approved', generated: 1, approved: 1, rejected: 0 });
    const [row] = await rowsFor('2026-12-02');
    expect(row).toMatchObject({
      gameId: 'devdle',
      date: '2026-12-02',
      number: 13,
      status: 'approved',
      attempt: 0,
      seed: seedHex('2026-12-02', 0),
      generatorVersion: 'devdle@1',
    });
    const verification = row!.verification as { ok: boolean; checks: unknown[] };
    expect(verification.ok).toBe(true);
    expect(verification.checks).toHaveLength(5);
    const payload = payloadSchema.parse(row!.payload);
    expect(payload.date).toBe('2026-12-02');
    const used = await t.owner.db
      .select()
      .from(terms)
      .where(eq(terms.lastUsedDevdle, '2026-12-02'));
    expect(used.map((r) => r.id)).toEqual([payload.term_id]);
  });

  it('es determinista', async () => {
    await insertTerms(t.owner.db, BANK16);
    await generateForDate({ entry, date: '2026-12-02' }, setup().deps);
    const first = (await rowsFor('2026-12-02'))[0]!.payload as { word: string };
    await t.reset();
    await insertTerms(t.owner.db, BANK16);
    await generateForDate({ entry, date: '2026-12-02' }, setup().deps);
    const second = (await rowsFor('2026-12-02'))[0]!.payload as { word: string };
    expect(second.word).toBe(first.word);
  });

  it('un candidato sin textos queda rejected en todos los intentos', async () => {
    await insertTerms(t.owner.db, [
      {
        term: 'ORPHAN',
        category: 'linux',
        summary: { es: '', en: 'orphan summary' },
      },
    ]);
    const { deps, lines } = setup(3);
    const result = await generateForDate({ entry, date: '2026-12-02' }, deps);
    expect(result).toEqual({ outcome: 'missing', generated: 3, approved: 0, rejected: 3 });
    const rows = await rowsFor('2026-12-02');
    expect(rows.map((r) => r.attempt)).toEqual([0, 1, 2]);
    rows.forEach((r, a) => {
      expect(r).toMatchObject({ status: 'rejected', seed: seedHex('2026-12-02', a) });
      expect(r.verification).toMatchObject({ ok: false, reason: 'texts_bilingual' });
    });
    const [orphan] = await t.owner.db.select().from(terms);
    expect(orphan?.lastUsedDevdle).toBeNull();
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'warn',
        msg: 'ChallengeGenerationFailed',
        game_id: 'devdle',
        date: '2026-12-02',
        attempts: 3,
      }),
    );
  });

  it('rechaza un término usado hace menos de 365 días', async () => {
    await insertTerms(t.owner.db, [
      { term: 'REACT', category: 'programming_languages', lastUsedDevdle: '2026-06-01' },
    ]);
    const result = await generateForDate({ entry, date: '2026-12-02' }, setup(2).deps);
    expect(result.outcome).toBe('missing');
    const rows = await rowsFor('2026-12-02');
    expect(rows).toHaveLength(2);
    rows.forEach((r) => expect(r.verification).toMatchObject({ reason: 'not_used_365' }));
  });

  it('excluye la categoría usada en los 3 días previos', async () => {
    await insertTerms(t.owner.db, [
      { term: 'REACT', category: 'programming_languages' },
      { term: 'MERGE', category: 'git' },
    ]);
    await makeChallenge(t.owner.db, {
      gameId: 'devdle',
      date: '2026-12-01',
      status: 'approved',
      number: 12,
      payload: {
        term_id: '00000000-0000-4000-8000-000000000000',
        word: 'OTHER',
        category: 'git',
        definition: { es: 'a', en: 'b' },
        summary: { es: 'a', en: 'b' },
        date: '2026-12-01',
      },
    });
    await generateForDate({ entry, date: '2026-12-02' }, setup().deps);
    const approved = (await rowsFor('2026-12-02')).find((r) => r.status === 'approved');
    expect((approved!.payload as { category: string }).category).toBe('programming_languages');
  });

  it('un choque con el índice único deja el candidato rejected como duplicate_active', async () => {
    await insertTerms(t.owner.db, BANK16);
    const { deps, repo } = setup();
    const wrapped = {
      ...deps,
      repo: {
        bankItems: repo.bankItems.bind(repo),
        recentChallenges: repo.recentChallenges.bind(repo),
        insertDraft: repo.insertDraft.bind(repo),
        reject: repo.reject.bind(repo),
        approve: async (...args: Parameters<typeof repo.approve>) => {
          await makeChallenge(t.owner.db, {
            gameId: 'devdle',
            date: '2026-12-02',
            status: 'approved',
            number: 13,
          });
          return repo.approve(...args);
        },
      },
    };
    const result = await generateForDate({ entry, date: '2026-12-02' }, wrapped);
    expect(result).toEqual({ outcome: 'covered', generated: 1, approved: 0, rejected: 1 });
    const rows = await rowsFor('2026-12-02');
    expect(rows.filter((r) => r.status === 'approved')).toHaveLength(1);
    const candidate = rows.find((r) => r.status === 'rejected')!;
    expect(candidate.verification).toMatchObject({ ok: false, reason: 'duplicate_active' });
    const used = await t.owner.db
      .select()
      .from(terms)
      .where(eq(terms.lastUsedDevdle, '2026-12-02'));
    expect(used).toHaveLength(0);
  });

  it('no arranca un intento con la señal abortada', async () => {
    await insertTerms(t.owner.db, BANK16);
    const controller = new AbortController();
    controller.abort();
    const result = await generateForDate(
      { entry, date: '2026-12-02' },
      setup(20, { signal: controller.signal }).deps,
    );
    expect(result).toEqual({ outcome: 'aborted', generated: 0, approved: 0, rejected: 0 });
    expect(await rowsFor('2026-12-02')).toHaveLength(0);
  });

  it('con el banco vacío rechaza con un error y no deja filas', async () => {
    await expect(generateForDate({ entry, date: '2026-12-02' }, setup().deps)).rejects.toThrow();
    expect(await rowsFor('2026-12-02')).toHaveLength(0);
  });
});
