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
import { seedDevdle } from '../helpers/challenges';
import { captureLogger } from '../helpers/logger';
import { withGenerator } from '../helpers/registry';

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
    expect(result).toMatchObject({ outcome: 'approved', generated: 1, approved: 1, rejected: 0 });
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
    expect(result).toMatchObject({ outcome: 'missing', generated: 3, approved: 0, rejected: 3 });
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
    expect(result).toMatchObject({ outcome: 'covered', generated: 1, approved: 0, rejected: 1 });
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
    expect(result).toMatchObject({ outcome: 'aborted', generated: 0, approved: 0, rejected: 0 });
    expect(await rowsFor('2026-12-02')).toHaveLength(0);
  });

  it('con el banco vacío rechaza con un error y no deja filas', async () => {
    await expect(generateForDate({ entry, date: '2026-12-02' }, setup().deps)).rejects.toThrow();
    expect(await rowsFor('2026-12-02')).toHaveLength(0);
  });
});

describe('generateForDate: firstAttempt y modo regenerate', () => {
  it('sin opciones mantiene el comportamiento (lastReason null)', async () => {
    await insertTerms(t.owner.db, BANK16);
    const result = await generateForDate({ entry, date: '2026-12-05' }, setup().deps);
    expect(result).toMatchObject({
      outcome: 'approved',
      generated: 1,
      approved: 1,
      rejected: 0,
      lastReason: null,
    });
    expect((await rowsFor('2026-12-05'))[0]).toMatchObject({ attempt: 0, status: 'approved' });
  });

  it('firstAttempt desplaza los intentos y el seed; regenerate deja el candidato en draft', async () => {
    await insertTerms(t.owner.db, BANK16);
    const result = await generateForDate(
      { entry, date: '2026-12-05', firstAttempt: 7, mode: 'regenerate' },
      setup().deps,
    );
    const [row] = await rowsFor('2026-12-05');
    expect(row).toMatchObject({ attempt: 7, status: 'draft', seed: seedHex('2026-12-05', 7) });
    expect(result.outcome).toBe('verified');
    expect(result.candidate).toMatchObject({
      id: row!.id,
      bank: 'terms',
      lastUsedField: 'last_used_devdle',
      itemIds: [(row!.payload as { term_id: string }).term_id],
      verification: { ok: true },
    });
    const used = await t.owner.db
      .select()
      .from(terms)
      .where(eq(terms.lastUsedDevdle, '2026-12-05'));
    expect(used).toHaveLength(0);
  });

  it('regenerate agota los intentos sin loguear ChallengeGenerationFailed', async () => {
    await insertTerms(t.owner.db, [
      { term: 'REACT', category: 'programming_languages', lastUsedDevdle: '2026-12-05' },
    ]);
    const { deps, lines } = setup(3);
    const result = await generateForDate(
      { entry, date: '2026-12-05', firstAttempt: 1, mode: 'regenerate' },
      deps,
    );
    expect(result).toMatchObject({
      outcome: 'missing',
      generated: 3,
      rejected: 3,
      lastReason: 'not_used_365',
    });
    expect((await rowsFor('2026-12-05')).map((r) => [r.attempt, r.status])).toEqual([
      [1, 'rejected'],
      [2, 'rejected'],
      [3, 'rejected'],
    ]);
    expect(lines().some((l) => l.msg === 'ChallengeGenerationFailed')).toBe(false);
  });

  it('en modo fill loguea ChallengeGenerationFailed y devuelve lastReason', async () => {
    await insertTerms(t.owner.db, [
      { term: 'REACT', category: 'programming_languages', lastUsedDevdle: '2026-12-05' },
    ]);
    const { deps, lines } = setup(3);
    const result = await generateForDate({ entry, date: '2026-12-15' }, deps);
    expect(result).toMatchObject({ outcome: 'missing', lastReason: 'not_used_365' });
    expect(lines()).toContainEqual(
      expect.objectContaining({
        msg: 'ChallengeGenerationFailed',
        game_id: 'devdle',
        date: '2026-12-15',
        attempts: 3,
      }),
    );
  });
});

const asyncOk = async () => {
  await new Promise((r) => setTimeout(r, 10));
  return { ok: true, checks: [{ name: 'async_check', ok: true }] };
};
const asyncFail = async () => ({ ok: false, checks: [], reason: 'async_forced' });

describe('generateForDate: verify asíncrono', () => {
  it('verify asíncrono que aprueba guarda el log resuelto (S-042 TS-11)', async () => {
    await insertTerms(t.owner.db, BANK16);
    const result = await generateForDate(
      { entry: withGenerator(entry, { verify: asyncOk }), date: '2026-12-02' },
      setup().deps,
    );
    expect(result).toMatchObject({
      outcome: 'approved',
      generated: 1,
      approved: 1,
      rejected: 0,
      lastReason: null,
    });
    const [row] = await rowsFor('2026-12-02');
    expect(row).toMatchObject({ status: 'approved', attempt: 0 });
    expect(row!.verification).toEqual({ ok: true, checks: [{ name: 'async_check', ok: true }] });
    const used = await t.owner.db
      .select()
      .from(terms)
      .where(eq(terms.lastUsedDevdle, '2026-12-02'));
    expect(used.map((u) => u.id)).toEqual([(row!.payload as { term_id: string }).term_id]);
  });

  it('rechaza y después aprueba con el seed siguiente (S-042 TS-12)', async () => {
    await insertTerms(t.owner.db, BANK16);
    let calls = 0;
    const flaky = withGenerator(entry, {
      verify: async (p: never, h: never) =>
        calls++ === 0
          ? { ok: false, checks: [], reason: 'async_forced' }
          : entry.generator.verify(p, h),
    });
    const result = await generateForDate({ entry: flaky, date: '2026-12-02' }, setup().deps);
    expect(result).toMatchObject({ outcome: 'approved', generated: 2, approved: 1, rejected: 1 });
    const rows = await rowsFor('2026-12-02');
    expect(rows[0]).toMatchObject({
      attempt: 0,
      status: 'rejected',
      seed: seedHex('2026-12-02', 0),
      verification: { ok: false, reason: 'async_forced' },
    });
    expect(rows[1]).toMatchObject({
      attempt: 1,
      status: 'approved',
      seed: seedHex('2026-12-02', 1),
    });
  });

  it('rechazo asíncrono permanente agota los intentos (S-042 TS-13)', async () => {
    await insertTerms(t.owner.db, BANK16);
    const { deps, lines } = setup(3);
    const result = await generateForDate(
      { entry: withGenerator(entry, { verify: asyncFail }), date: '2026-12-02' },
      deps,
    );
    expect(result).toMatchObject({
      outcome: 'missing',
      generated: 3,
      approved: 0,
      rejected: 3,
      lastReason: 'async_forced',
    });
    const rows = await rowsFor('2026-12-02');
    expect(rows.map((r) => [r.attempt, r.status])).toEqual([
      [0, 'rejected'],
      [1, 'rejected'],
      [2, 'rejected'],
    ]);
    for (const r of rows) expect(r.verification).toMatchObject({ reason: 'async_forced' });
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'warn',
        msg: 'ChallengeGenerationFailed',
        game_id: 'devdle',
        date: '2026-12-02',
        attempts: 3,
      }),
    );
    expect(
      await t.owner.db.select().from(terms).where(eq(terms.lastUsedDevdle, '2026-12-02')),
    ).toHaveLength(0);
  });

  it('en modo regenerate devuelve el log resuelto (S-042 TS-14)', async () => {
    await insertTerms(t.owner.db, BANK16);
    const result = await generateForDate(
      {
        entry: withGenerator(entry, { verify: asyncOk }),
        date: '2026-12-05',
        firstAttempt: 7,
        mode: 'regenerate',
      },
      setup().deps,
    );
    expect(result.outcome).toBe('verified');
    expect(result.candidate!.verification).toEqual({
      ok: true,
      checks: [{ name: 'async_check', ok: true }],
    });
    expect(result.candidate!.verification).not.toBeInstanceOf(Promise);
    const [row] = await rowsFor('2026-12-05');
    expect(result.candidate).toMatchObject({
      bank: 'terms',
      lastUsedField: 'last_used_devdle',
      itemIds: [(row!.payload as { term_id: string }).term_id],
    });
    expect(row).toMatchObject({ attempt: 7, status: 'draft', seed: seedHex('2026-12-05', 7) });
    expect(
      await t.owner.db.select().from(terms).where(eq(terms.lastUsedDevdle, '2026-12-05')),
    ).toHaveLength(0);
  });

  it('la promesa de verify que rechaza se propaga (S-042 TS-15)', async () => {
    await insertTerms(t.owner.db, BANK16);
    const { deps, lines } = setup();
    const boom = withGenerator(entry, {
      verify: async () => {
        throw new Error('verify_boom');
      },
    });
    await expect(generateForDate({ entry: boom, date: '2026-12-02' }, deps)).rejects.toThrow(
      'verify_boom',
    );
    const rows = await rowsFor('2026-12-02');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ attempt: 0, status: 'draft' });
    expect(
      lines().some((l) => l.msg === 'ChallengeApproved' || l.msg === 'ChallengeRejected'),
    ).toBe(false);
  });
});

describe('generateForDate: ventana de historia', () => {
  const seedWindow = async () => {
    await insertTerms(t.owner.db, BANK16);
    const rows: [string, 'approved' | 'published' | 'voided' | 'rejected' | 'draft'][] = [
      ['2026-12-10', 'approved'],
      ['2026-12-11', 'approved'],
      ['2027-01-09', 'published'],
      ['2027-01-10', 'approved'],
      ['2027-01-11', 'voided'],
      ['2027-01-20', 'rejected'],
      ['2027-01-21', 'draft'],
      ['2027-02-09', 'approved'],
      ['2027-02-10', 'approved'],
    ];
    for (const [date, status] of rows) await seedDevdle(t.owner.db, date, status);
  };
  const run = async (historySpec: typeof entry.generator.historySpec) => {
    let captured: string[] = [];
    const result = await generateForDate(
      {
        entry: withGenerator(entry, {
          historySpec,
          verify: (_p: never, h: { recentChallenges: readonly { date: string }[] }) => {
            captured = h.recentChallenges.map((c) => c.date);
            return { ok: true, checks: [] };
          },
        }),
        date: '2027-01-10',
        mode: 'regenerate',
      },
      setup().deps,
    );
    return { result, captured };
  };
  const spec = entry.generator.historySpec;

  it('pide [D-30, D+30] sin la fila de D (S-042 TS-7)', async () => {
    await seedWindow();
    const { result, captured } = await run({ ...spec, recentDays: 30, aheadDays: 30 });
    expect(result.outcome).toBe('verified');
    expect(captured).toEqual(['2026-12-11', '2027-01-09', '2027-01-11', '2027-02-09']);
    const rows = await rowsFor('2027-01-10');
    expect(rows.map((r) => r.status).sort()).toEqual(['approved', 'draft']);
  });

  it('sin aheadDays solo mira hacia atrás (S-042 TS-8)', async () => {
    await seedWindow();
    const { result, captured } = await run({ ...spec, recentDays: 30 });
    expect(result.outcome).toBe('verified');
    expect(captured).toEqual(['2026-12-11', '2027-01-09']);
  });

  it('aheadDays 0 explícito equivale a ausente (S-042 TS-9)', async () => {
    await seedWindow();
    const { captured } = await run({ ...spec, recentDays: 30, aheadDays: 0 });
    expect(captured).toEqual(['2026-12-11', '2027-01-09']);
  });

  it('Devdle real no ve los aprobados futuros (S-042 TS-10)', async () => {
    await insertTerms(t.owner.db, BANK16);
    for (const d of ['2026-11-28', '2026-11-29', '2026-12-01', '2026-12-03'])
      await seedDevdle(t.owner.db, d, 'approved');
    let captured: string[] = [];
    const result = await generateForDate(
      {
        entry: withGenerator(entry, {
          generate: (input) => {
            captured = input.history.recentChallenges.map((c) => c.date);
            return entry.generator.generate(input);
          },
        }),
        date: '2026-12-02',
      },
      setup().deps,
    );
    expect(result.outcome).toBe('approved');
    expect(captured).toEqual(['2026-11-29', '2026-12-01']);
  });
});
