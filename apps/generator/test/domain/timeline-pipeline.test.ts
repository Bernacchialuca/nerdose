import { createHmac } from 'node:crypto';

import { challenges, terms, timelineFacts } from '@nerdose/db';
import { payloadSchema } from '@nerdose/game-timeline/definition';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { generateForDate, type GenerateDeps } from '@/domain/challenge-publishing/generate';
import { generatorRegistry } from '@/games/registry';

import { BANK16, insertTerms } from '../helpers/bank';
import { setupTestDb } from '../helpers/db';
import { AMBIGUOUS5, CHRONO5, EXTRA_PL5, FACT_ID, insertFacts } from '../helpers/facts';
import { captureLogger } from '../helpers/logger';

const SECRET = 'test-secret-0123456789abcdef0123456789';
const seedHex = (date: string, attempt: number, secret = SECRET) =>
  createHmac('sha256', secret).update(`timeline:${date}:${attempt}`).digest('hex');

const t = setupTestDb();
const entry = generatorRegistry.get('timeline');

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
    .where(and(eq(challenges.gameId, 'timeline'), eq(challenges.date, date)))
    .orderBy(asc(challenges.attempt));

const allFacts = () => t.owner.db.select().from(timelineFacts);
const parse = (payload: unknown) => payloadSchema.parse(payload);
const order = (payload: unknown) => {
  const p = parse(payload);
  const byOpaque = new Map(p.items.map((i) => [i.opaque_id, i.label]));
  return p.correct_order.map((id) => byOpaque.get(id));
};

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

describe('generateForDate con timeline', () => {
  it('TS-13/14 aprueba un hueco con 9 checks, last_used y terms intacto', async () => {
    await insertTerms(t.owner.db, BANK16);
    await insertFacts(t.owner.db, CHRONO5);
    const result = await generateForDate({ entry, date: '2026-12-02' }, setup().deps);
    expect(result).toEqual({ outcome: 'approved', generated: 1, approved: 1, rejected: 0 });
    const [row] = await rowsFor('2026-12-02');
    expect(row).toMatchObject({
      gameId: 'timeline',
      date: '2026-12-02',
      number: 13,
      status: 'approved',
      attempt: 0,
      seed: seedHex('2026-12-02', 0),
      generatorVersion: 'timeline@1',
    });
    const verification = row!.verification as { ok: boolean; checks: { name: string }[] };
    expect(verification.ok).toBe(true);
    expect(verification.checks.map((c) => c.name)).toEqual([
      'items_count',
      'facts_in_bank',
      'item_category',
      'texts_bilingual',
      'distinguishable',
      'correct_order_consistent',
      'opaque_ids',
      'shuffled',
      'not_used_90',
    ]);
    const payload = parse(row!.payload);
    expect(payload.date).toBe('2026-12-02');
    expect(payload).not.toHaveProperty('category');
    expect(payload.items.every((i) => i.category === 'programming_languages')).toBe(true);
    expect(payload.items.map((i) => i.fact_id).sort()).toEqual(CHRONO5.map((f) => f.id).sort());
    expect(payload.prompt).toEqual({
      es: 'Ordená estos hitos del más antiguo al más reciente',
      en: 'Order these milestones from oldest to newest',
    });
    expect(order(row!.payload)).toEqual(['Python', 'Java', 'Go', 'Docker', 'Kubernetes']);
    expect(payload.items.map((i) => i.opaque_id)).not.toEqual(payload.correct_order);

    (await allFacts()).forEach((f) => expect(f.lastUsed).toBe('2026-12-02'));
    (await t.owner.db.select().from(terms)).forEach((r) => {
      expect(r.lastUsedDevdle).toBeNull();
      expect(r.lastUsedGrep).toBeNull();
    });
  });

  it('TS-15/16 es determinista y depende del secreto', async () => {
    const shape = async (secret = SECRET) => {
      await t.reset();
      await insertFacts(t.owner.db, CHRONO5);
      await generateForDate({ entry, date: '2026-12-02' }, setup(20, secret).deps);
      const [row] = await rowsFor('2026-12-02');
      return { seed: row!.seed, payload: row!.payload, order: order(row!.payload) };
    };
    const first = await shape();
    const second = await shape();
    expect(second).toEqual(first);
    const other = await shape('other-secret-0123456789abcdef0123456789');
    expect(other.seed).not.toBe(first.seed);
    expect(parse(other.payload).correct_order).not.toEqual(parse(first.payload).correct_order);
  });

  it('TS-17 reintenta un candidato rechazado con el seed siguiente', async () => {
    await insertFacts(t.owner.db, CHRONO5);
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
    (await allFacts()).forEach((f) => expect(f.lastUsed).toBe('2026-12-02'));
  });

  it('TS-18 un hecho usado el 2026-11-20 no se elige el 2026-12-10', async () => {
    await insertFacts(
      t.owner.db,
      CHRONO5.map((f) => (f.id === FACT_ID('02') ? { ...f, lastUsed: '2026-11-20' } : f)),
    );
    const { deps, lines } = setup(2);
    const result = await generateForDate({ entry, date: '2026-12-10' }, deps);
    expect(result).toEqual({ outcome: 'missing', generated: 2, approved: 0, rejected: 2 });
    const rows = await rowsFor('2026-12-10');
    expect(rows).toHaveLength(2);
    rows.forEach((r) => {
      expect(r.status).toBe('rejected');
      expect(r.verification).toMatchObject({ reason: 'not_used_90' });
    });
    (await allFacts()).forEach((f) =>
      expect(f.lastUsed).toBe(f.id === FACT_ID('02') ? '2026-11-20' : null),
    );
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'warn',
        msg: 'ChallengeGenerationFailed',
        game_id: 'timeline',
        date: '2026-12-10',
        attempts: 2,
      }),
    );
  });

  it('TS-19 el mismo hecho sí se elige el 2027-02-20', async () => {
    await insertFacts(
      t.owner.db,
      CHRONO5.map((f) => (f.id === FACT_ID('02') ? { ...f, lastUsed: '2026-11-20' } : f)),
    );
    const result = await generateForDate({ entry, date: '2027-02-20' }, setup().deps);
    expect(result.outcome).toBe('approved');
    const [row] = await rowsFor('2027-02-20');
    expect(row!.number).toBe(93);
    expect(parse(row!.payload).items.map((i) => i.fact_id)).toContain(FACT_ID('02'));
    (await allFacts()).forEach((f) => expect(f.lastUsed).toBe('2027-02-20'));
  });

  it('TS-20 un desafío reciente excluye sus hechos al día siguiente', async () => {
    await insertFacts(t.owner.db, [...CHRONO5, ...EXTRA_PL5]);
    const { deps } = setup();
    expect((await generateForDate({ entry, date: '2026-12-02' }, deps)).outcome).toBe('approved');
    expect((await generateForDate({ entry, date: '2026-12-03' }, deps)).outcome).toBe('approved');
    const first = parse((await rowsFor('2026-12-02'))[0]!.payload).items.map((i) => i.fact_id);
    const second = parse((await rowsFor('2026-12-03'))[0]!.payload).items.map((i) => i.fact_id);
    expect(second.filter((id) => first.includes(id))).toEqual([]);
  });

  it('TS-21 hechos indistinguibles se rechazan', async () => {
    await insertFacts(t.owner.db, AMBIGUOUS5);
    const result = await generateForDate({ entry, date: '2026-12-02' }, setup(3).deps);
    expect(result.outcome).toBe('missing');
    const rows = await rowsFor('2026-12-02');
    expect(rows.map((r) => r.attempt)).toEqual([0, 1, 2]);
    rows.forEach((r, a) => {
      expect(r).toMatchObject({ status: 'rejected', seed: seedHex('2026-12-02', a) });
      expect(r.verification).toMatchObject({ reason: 'distinguishable' });
    });
    (await allFacts()).forEach((f) => expect(f.lastUsed).toBeNull());
  });

  it('TS-22 con menos de 5 hechos en el banco propaga RangeError', async () => {
    await insertFacts(t.owner.db, CHRONO5.slice(0, 4));
    await expect(generateForDate({ entry, date: '2026-12-02' }, setup().deps)).rejects.toThrow(
      /the bank has fewer than 5 facts/,
    );
    expect(await rowsFor('2026-12-02')).toHaveLength(0);
  });
});
