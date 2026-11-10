import { createHmac } from 'node:crypto';

import { challenges, terms } from '@nerdose/db';
import { payloadSchema } from '@nerdose/game-grep-grid/definition';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { generateForDate, type GenerateDeps } from '@/domain/challenge-publishing/generate';
import { generatorRegistry } from '@/games/registry';

import { BANK16, insertTerms, type TermSpec } from '../helpers/bank';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

const SECRET = 'test-secret-0123456789abcdef0123456789';
const seedHex = (date: string, attempt: number, secret = SECRET) =>
  createHmac('sha256', secret).update(`grep-grid:${date}:${attempt}`).digest('hex');

const t = setupTestDb();
const entry = generatorRegistry.get('grep-grid');

function setup(maxAttempts = 20, secret = SECRET) {
  const captured = captureLogger();
  const deps: GenerateDeps = {
    repo: new ChallengePublishingRepository(t.svc.db),
    env: {
      GENERATOR_SECRET: secret,
      LAUNCH_DATE: '2026-11-20',
      GENERATION_MAX_ATTEMPTS: maxAttempts,
    },
    log: captured.logger,
    signal: new AbortController().signal,
  };
  return { deps, lines: captured.lines };
}

const rowsFor = (date: string) =>
  t.owner.db
    .select()
    .from(challenges)
    .where(and(eq(challenges.gameId, 'grep-grid'), eq(challenges.date, date)))
    .orderBy(asc(challenges.attempt));

const allTerms = () => t.owner.db.select().from(terms);
const parse = (payload: unknown) => payloadSchema.parse(payload);

const EIGHT = ['REACT', 'MERGE', 'REDIS', 'ROUTER', 'KERNEL', 'OAUTH', 'CIPHER', 'COMPILER'];
const eightBank = (extra: (term: string) => Partial<TermSpec> = () => ({})): TermSpec[] =>
  BANK16.filter((b) => EIGHT.includes(b.term)).map((b) => ({ ...b, ...extra(b.term) }));

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

describe('generateForDate con grep-grid', () => {
  it('aprueba un hueco con number, seed HMAC, 9 checks y last_used_grep', async () => {
    await insertTerms(t.owner.db, BANK16);
    const result = await generateForDate({ entry, date: '2026-12-02' }, setup().deps);
    expect(result).toEqual({ outcome: 'approved', generated: 1, approved: 1, rejected: 0 });
    const [row] = await rowsFor('2026-12-02');
    expect(row).toMatchObject({
      gameId: 'grep-grid',
      date: '2026-12-02',
      number: 13,
      status: 'approved',
      attempt: 0,
      seed: seedHex('2026-12-02', 0),
      generatorVersion: 'grep-grid@1',
    });
    const verification = row!.verification as { ok: boolean; checks: { name: string }[] };
    expect(verification.ok).toBe(true);
    expect(verification.checks.map((c) => c.name)).toEqual([
      'grid_shape',
      'words_count',
      'words_in_bank',
      'word_shape',
      'texts_bilingual',
      'no_substrings',
      'placements_consistent',
      'exactly_once',
      'not_used_30',
    ]);
    const payload = parse(row!.payload);
    expect(payload.date).toBe('2026-12-02');
    expect(payload.grid).toHaveLength(12);
    expect(payload.words).toHaveLength(8);
    const ids = payload.words.map((w) => w.term_id);
    expect(new Set(ids).size).toBe(8);
    const bank = new Set(BANK16.map((b) => b.term));
    payload.words.forEach((w) => {
      expect(bank.has(w.word)).toBe(true);
      expect(w.word.length).toBeLessThanOrEqual(12);
    });

    const rows = await allTerms();
    const used = rows.filter((r) => r.lastUsedGrep === '2026-12-02').map((r) => r.id);
    expect(used.sort()).toEqual([...ids].sort());
    expect(rows.filter((r) => r.lastUsedGrep === null)).toHaveLength(8);
    rows.forEach((r) => expect(r.lastUsedDevdle).toBeNull());
  });

  it('es determinista y depende del secreto', async () => {
    const shape = async (secret = SECRET) => {
      await t.reset();
      await insertTerms(t.owner.db, BANK16);
      await generateForDate({ entry, date: '2026-12-02' }, setup(20, secret).deps);
      const [row] = await rowsFor('2026-12-02');
      const p = parse(row!.payload);
      return {
        seed: row!.seed,
        grid: p.grid,
        words: p.words.map((w) => w.word),
        placements: p.placements.map(({ from, to, direction }) => ({ from, to, direction })),
      };
    };
    const first = await shape();
    const second = await shape();
    expect(second).toEqual(first);
    const other = await shape('other-secret-0123456789abcdef0123456789');
    expect(other.seed).not.toBe(first.seed);
    expect(other.grid).not.toEqual(first.grid);
  });

  it('reintenta un candidato rechazado con el seed del intento siguiente', async () => {
    await insertTerms(t.owner.db, BANK16);
    let calls = 0;
    const forced = {
      ...entry,
      generator: {
        ...entry.generator,
        verify: (p: never, h: never) =>
          calls++ === 0
            ? { ok: false, checks: [], reason: 'forced' }
            : entry.generator.verify(p, h),
      },
    } as typeof entry;
    const result = await generateForDate({ entry: forced, date: '2026-12-02' }, setup().deps);
    expect(result).toEqual({ outcome: 'approved', generated: 2, approved: 1, rejected: 1 });
    const rows = await rowsFor('2026-12-02');
    expect(rows[0]).toMatchObject({
      attempt: 0,
      status: 'rejected',
      seed: seedHex('2026-12-02', 0),
      verification: { ok: false, reason: 'forced' },
    });
    expect(rows[1]).toMatchObject({
      attempt: 1,
      status: 'approved',
      seed: seedHex('2026-12-02', 1),
    });
    const ids = parse(rows[1]!.payload).words.map((w) => w.term_id);
    const used = (await allTerms()).filter((r) => r.lastUsedGrep !== null).map((r) => r.id);
    expect(used.sort()).toEqual([...ids].sort());
  });

  it('agota los 20 intentos si los 8 términos están dentro de la ventana de 30 días', async () => {
    await insertTerms(
      t.owner.db,
      eightBank(() => ({ lastUsedGrep: '2026-11-25' })),
    );
    const { deps, lines } = setup(20);
    const result = await generateForDate({ entry, date: '2026-12-02' }, deps);
    expect(result).toEqual({ outcome: 'missing', generated: 20, approved: 0, rejected: 20 });
    const rows = await rowsFor('2026-12-02');
    expect(rows.map((r) => r.attempt)).toEqual(Array.from({ length: 20 }, (_, i) => i));
    rows.forEach((r, a) => {
      expect(r).toMatchObject({ status: 'rejected', seed: seedHex('2026-12-02', a) });
      expect(r.verification).toMatchObject({ reason: 'not_used_30' });
    });
    (await allTerms()).forEach((r) => expect(r.lastUsedGrep).toBe('2026-11-25'));
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'warn',
        msg: 'ChallengeGenerationFailed',
        game_id: 'grep-grid',
        date: '2026-12-02',
        attempts: 20,
      }),
    );
  });

  it('un término usado el 2026-11-20 no se elige el 2026-12-10', async () => {
    await insertTerms(
      t.owner.db,
      eightBank((term) => ({ lastUsedGrep: term === 'REACT' ? '2026-11-20' : null })),
    );
    const result = await generateForDate({ entry, date: '2026-12-10' }, setup(2).deps);
    expect(result.outcome).toBe('missing');
    const rows = await rowsFor('2026-12-10');
    expect(rows).toHaveLength(2);
    rows.forEach((r) => {
      expect(r.status).toBe('rejected');
      expect(r.verification).toMatchObject({ reason: 'not_used_30' });
    });
    const react = (await allTerms()).find((r) => r.term === 'REACT');
    expect(react?.lastUsedGrep).toBe('2026-11-20');
  });

  it('el mismo término sí se elige el 2026-12-21', async () => {
    await insertTerms(
      t.owner.db,
      eightBank((term) => ({ lastUsedGrep: term === 'REACT' ? '2026-11-20' : null })),
    );
    const result = await generateForDate({ entry, date: '2026-12-21' }, setup().deps);
    expect(result.outcome).toBe('approved');
    const [row] = await rowsFor('2026-12-21');
    expect(parse(row!.payload).words.map((w) => w.word)).toContain('REACT');
    (await allTerms()).forEach((r) => expect(r.lastUsedGrep).toBe('2026-12-21'));
  });

  it('un desafío reciente excluye sus términos al día siguiente', async () => {
    await insertTerms(t.owner.db, BANK16);
    const { deps } = setup();
    await generateForDate({ entry, date: '2026-12-02' }, deps);
    const result = await generateForDate({ entry, date: '2026-12-03' }, deps);
    expect(result.outcome).toBe('approved');
    const first = parse((await rowsFor('2026-12-02'))[0]!.payload).words.map((w) => w.term_id);
    const second = parse((await rowsFor('2026-12-03'))[0]!.payload).words.map((w) => w.term_id);
    expect(second.filter((id) => first.includes(id))).toEqual([]);
    expect(new Set([...first, ...second]).size).toBe(16);
  });

  it('con menos de 8 términos propaga RangeError y no escribe filas', async () => {
    await insertTerms(
      t.owner.db,
      BANK16.filter((b) => ['REACT', 'MERGE', 'REDIS'].includes(b.term)),
    );
    await expect(generateForDate({ entry, date: '2026-12-02' }, setup().deps)).rejects.toThrow(
      /fewer than 8 terms/,
    );
    expect(await rowsFor('2026-12-02')).toHaveLength(0);
  });
});
