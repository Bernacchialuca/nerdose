import { createHmac } from 'node:crypto';

import { challenges, generationFailures, generationRequests, terms } from '@nerdose/db';
import { makeChallenge } from '@nerdose/db/testing';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { processNextRequest } from '@/domain/challenge-publishing/queue/process-request';

import { BANK16, insertTerms } from '../helpers/bank';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';
import { approveOld, D, ENV, NOW, requestFor, SECRET } from '../helpers/regeneration';
import { devdleOnlyRegistry } from '../helpers/registry';

const t = setupTestDb();
const seedHex = (date: string, attempt: number) =>
  createHmac('sha256', SECRET).update(`devdle:${date}:${attempt}`).digest('hex');

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

function deps(
  extra: {
    attempts?: number;
    signal?: AbortSignal;
    repoFactory?: Parameters<typeof processNextRequest>[0]['repoFactory'];
  } = {},
) {
  const captured = captureLogger();
  return {
    run: () =>
      processNextRequest({
        db: t.svc.db,
        env: { ...ENV, GENERATION_MAX_ATTEMPTS: extra.attempts ?? 20 },
        registry: devdleOnlyRegistry,
        clock: { now: () => NOW },
        log: captured.logger,
        signal: extra.signal ?? new AbortController().signal,
        repoFactory: extra.repoFactory,
      }),
    lines: captured.lines,
  };
}

async function oldWithRequest(date = D, extra: Parameters<typeof insertTerms>[1] = []) {
  await insertTerms(t.owner.db, [...BANK16, ...extra]);
  await approveOld(t.svc.db, date);
  const [old] = await t.owner.db.select().from(challenges).where(eq(challenges.date, date));
  return { old: old!, request: await requestFor(t.owner.db, old!.id) };
}

const allChallenges = (date = D) =>
  t.owner.db.select().from(challenges).where(eq(challenges.date, date)).orderBy(challenges.attempt);
const requests = () => t.owner.db.select().from(generationRequests);
const termIdOf = (row: { payload: unknown }) => (row.payload as { term_id: string }).term_id;

describe('processNextRequest', () => {
  it('sin pedidos devuelve idle', async () => {
    expect(await deps().run()).toBe('idle');
  });

  it('reemplazo atómico feliz', async () => {
    const { old, request } = await oldWithRequest();
    const d = deps();
    expect(await d.run()).toBe('done');
    const rows = await allChallenges();
    const oldRow = rows.find((r) => r.id === old.id)!;
    expect(oldRow.status).toBe('rejected');
    expect(oldRow.verification).toMatchObject({ ok: true, reason: 'regenerated' });
    expect((oldRow.verification as { checks: unknown[] }).checks.length).toBeGreaterThan(0);
    const [req] = await requests();
    expect(req).toMatchObject({ status: 'done', error: null });
    expect(req!.processedAt).not.toBeNull();
    const nuevo = rows.find((r) => r.id === req!.newChallengeId)!;
    expect(nuevo).toMatchObject({
      status: 'approved',
      gameId: 'devdle',
      date: D,
      number: 16,
      attempt: 1,
      seed: seedHex(D, 1),
    });
    expect(termIdOf(nuevo)).not.toBe(termIdOf(oldRow));
    expect(rows.filter((r) => r.status === 'approved')).toHaveLength(1);
    const [newTerm] = await t.owner.db
      .select()
      .from(terms)
      .where(eq(terms.id, termIdOf(nuevo)));
    const [oldTerm] = await t.owner.db
      .select()
      .from(terms)
      .where(eq(terms.id, termIdOf(oldRow)));
    expect(newTerm!.lastUsedDevdle).toBe(D);
    expect(oldTerm!.lastUsedDevdle).toBe(D);
    expect(d.lines()).toContainEqual(
      expect.objectContaining({
        msg: 'ChallengeRegenerated',
        request_id: request.id,
        challenge_id: old.id,
        new_challenge_id: nuevo.id,
      }),
    );
  });

  it('los intentos nuevos arrancan en max(attempt) + 1', async () => {
    const { old } = await oldWithRequest();
    for (const attempt of [1, 4]) {
      await makeChallenge(t.owner.db, {
        gameId: 'devdle',
        date: D,
        status: 'rejected',
        attempt,
        seed: `x${attempt}`,
      });
    }
    expect(await deps().run()).toBe('done');
    const rows = await allChallenges();
    expect(rows.at(-1)!.attempt).toBe(5);
    expect(new Set(rows.map((r) => r.seed)).size).toBe(rows.length);
    expect(rows.find((r) => r.id === old.id)!.status).toBe('rejected');
  });

  it('nunca usa términos rechazados', async () => {
    await oldWithRequest(D, [{ term: 'TRAPS', category: 'security', status: 'rejected' }]);
    const [trap] = await t.owner.db.select().from(terms).where(eq(terms.term, 'TRAPS'));
    for (let i = 0; i < 3; i++) {
      await deps().run();
      const [current] = await t.owner.db
        .select()
        .from(challenges)
        .where(and(eq(challenges.date, D), eq(challenges.status, 'approved')));
      expect(termIdOf(current!)).not.toBe(trap!.id);
      await requestFor(t.owner.db, current!.id);
    }
  });

  it('falla si ningún candidato pasa, sin tocar generation_failures', async () => {
    await insertTerms(t.owner.db, [
      { term: 'REACT', category: 'programming_languages', lastUsedDevdle: '2026-12-05' },
    ]);
    await makeChallenge(t.owner.db, { gameId: 'devdle', date: D, status: 'approved' });
    const [old] = await t.owner.db.select().from(challenges);
    await requestFor(t.owner.db, old!.id);
    const d = deps({ attempts: 3 });
    expect(await d.run()).toBe('failed');
    const [req] = await requests();
    expect(req).toMatchObject({ status: 'failed', error: 'not_used_365', newChallengeId: null });
    expect(req!.processedAt).not.toBeNull();
    const rows = await allChallenges();
    expect(rows.find((r) => r.id === old!.id)!.status).toBe('approved');
    expect(rows.filter((r) => r.status === 'rejected').map((r) => r.attempt)).toEqual([1, 2, 3]);
    expect(await t.owner.db.select().from(generationFailures)).toHaveLength(0);
    expect(d.lines().some((l) => l.msg === 'ChallengeRegenerationFailed')).toBe(true);
  });

  it.each([
    ['fecha llegada', '2026-12-01', 'approved'],
    ['fecha pasada', '2026-11-30', 'approved'],
    ['ya no approved', D, 'published'],
  ] as const)('cancela al tomar: %s', async (_name, date, status) => {
    const old = await makeChallenge(t.owner.db, { gameId: 'devdle', date, status });
    await requestFor(t.owner.db, old.id);
    const d = deps();
    expect(await d.run()).toBe('cancelled');
    const [req] = await requests();
    expect(req!.status).toBe('cancelled');
    expect(req!.processedAt).not.toBeNull();
    expect(await t.owner.db.select().from(challenges)).toHaveLength(1);
    expect(d.lines().some((l) => l.msg === 'ChallengeRegenerationCancelled')).toBe(true);
  });

  it('cancela en el reemplazo si el viejo se publicó durante la generación', async () => {
    const { old } = await oldWithRequest();
    let once = false;
    const d = deps({
      repoFactory: (orm) => {
        const repo = new ChallengePublishingRepository(orm);
        const insertDraft = repo.insertDraft.bind(repo);
        repo.insertDraft = async (draft) => {
          const id = await insertDraft(draft);
          if (!once) {
            once = true;
            await t.owner.db
              .update(challenges)
              .set({ status: 'published' })
              .where(eq(challenges.id, old.id));
          }
          return id;
        };
        return repo;
      },
    });
    expect(await d.run()).toBe('cancelled');
    const rows = await allChallenges();
    expect(rows.find((r) => r.id === old.id)!.status).toBe('published');
    const nuevo = rows.find((r) => r.id !== old.id)!;
    expect(nuevo.status).toBe('rejected');
    expect(nuevo.verification).toMatchObject({ ok: true, reason: 'request_cancelled' });
    const [req] = await requests();
    expect(req).toMatchObject({ status: 'cancelled', newChallengeId: null });
    expect(req!.processedAt).not.toBeNull();
  });

  it('un error de BD en el reemplazo hace ROLLBACK y el reintento usa intentos nuevos', async () => {
    const { old } = await oldWithRequest();
    const failing = deps({
      repoFactory: (orm) => {
        const repo = new ChallengePublishingRepository(orm);
        repo.replaceChallenge = async (input) => {
          // Paso 1 real y luego falla: Tx A debe deshacerlo.
          await orm
            .update(challenges)
            .set({ status: 'rejected' })
            .where(eq(challenges.id, input.oldId));
          throw new Error('db down');
        };
        return repo;
      },
    });
    expect(await failing.run()).toBe('error');
    const [req] = await requests();
    expect(req).toMatchObject({ status: 'pending', processedAt: null });
    const rows = await allChallenges();
    expect(rows.find((r) => r.id === old.id)!.status).toBe('approved');
    expect(rows.find((r) => r.id !== old.id)!.status).toBe('draft');
    expect(failing.lines()).toContainEqual(
      expect.objectContaining({ level: 'error', msg: 'Regeneration replacement failed' }),
    );
    expect(await deps().run()).toBe('done');
    const after = await allChallenges();
    expect(after.filter((r) => r.status === 'approved')).toHaveLength(1);
    expect(Math.max(...after.map((r) => r.attempt))).toBe(2);
  });

  it('un error del pipeline marca el pedido failed con el mensaje', async () => {
    const old = await makeChallenge(t.owner.db, {
      gameId: 'big-o',
      date: D,
      status: 'approved',
    });
    await requestFor(t.owner.db, old.id);
    expect(await deps().run()).toBe('failed');
    const [req] = await requests();
    expect(req).toMatchObject({ status: 'failed', error: 'not_found' });
    expect(req!.processedAt).not.toBeNull();
    expect((await t.owner.db.select().from(challenges))[0]!.status).toBe('approved');
  });

  it('con la señal abortada tras el primer candidato devuelve aborted y deja el pedido pending', async () => {
    const { old } = await oldWithRequest();
    await t.owner.db.update(terms).set({ lastUsedDevdle: '2026-12-05' });
    const controller = new AbortController();
    const d = deps({
      signal: controller.signal,
      repoFactory: (orm) => {
        const repo = new ChallengePublishingRepository(orm);
        const insertDraft = repo.insertDraft.bind(repo);
        repo.insertDraft = async (draft) => {
          const id = await insertDraft(draft);
          controller.abort();
          return id;
        };
        return repo;
      },
    });
    expect(await d.run()).toBe('aborted');
    const [req] = await requests();
    expect(req!.status).toBe('pending');
    const rows = await allChallenges();
    expect(rows.find((r) => r.id === old.id)!.status).toBe('approved');
    expect(rows).toHaveLength(2);
  });
});
