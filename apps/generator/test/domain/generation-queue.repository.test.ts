import { challenges, createDb, generationRequests, terms } from '@nerdose/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, inject, it } from 'vitest';

import {
  ChallengePublishingRepository,
  type VerifiedCandidate,
} from '@/domain/challenge-publishing/challenge-publishing.repository';
import { generateForDate } from '@/domain/challenge-publishing/generate';
import { generatorRegistry } from '@/games/registry';

import { BANK16, insertTerms } from '../helpers/bank';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';
import { approveOld, D, ENV, requestFor } from '../helpers/regeneration';

const t = setupTestDb();
const entry = generatorRegistry.get('devdle');

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

async function oldAndCandidate() {
  await insertTerms(t.owner.db, BANK16);
  await approveOld(t.svc.db);
  const [old] = await t.owner.db.select().from(challenges);
  const result = await generateForDate(
    { entry, date: D, firstAttempt: 1, mode: 'regenerate' },
    {
      repo: new ChallengePublishingRepository(t.svc.db),
      env: ENV,
      log: captureLogger().logger,
      signal: new AbortController().signal,
    },
  );
  return { old: old!, candidate: result.candidate as VerifiedCandidate };
}

describe('maxAttempt', () => {
  it('devuelve el máximo de cualquier status, o null sin filas', async () => {
    const repo = new ChallengePublishingRepository(t.svc.db);
    expect(await repo.maxAttempt('devdle', D)).toBeNull();
    await oldAndCandidate();
    expect(await repo.maxAttempt('devdle', D)).toBe(1);
  });
});

describe('cola: takePendingRequest', () => {
  it('toma el más viejo y salta los bloqueados', async () => {
    await insertTerms(t.owner.db, BANK16);
    await approveOld(t.svc.db, '2026-12-05');
    await approveOld(t.svc.db, '2026-12-06');
    const rows = await t.owner.db.select().from(challenges).orderBy(challenges.date);
    const c5 = rows[0]!;
    const c6 = rows[1]!;
    const a = await requestFor(t.owner.db, c5.id, new Date('2026-12-01T10:00:00Z'));
    const b = await requestFor(t.owner.db, c6.id, new Date('2026-12-01T11:00:00Z'));
    const conn2 = createDb(inject('generatorUrl'), { max: 2 });
    try {
      let release!: () => void;
      const held = new Promise<void>((r) => (release = r));
      let took!: (id: string | undefined) => void;
      const firstTaken = new Promise<string | undefined>((r) => (took = r));
      const tx1 = t.svc.db.transaction(async (tx) => {
        took((await new ChallengePublishingRepository(tx).takePendingRequest())?.id);
        await held;
      });
      expect(await firstTaken).toBe(a.id);
      const second = await conn2.db.transaction((tx) =>
        new ChallengePublishingRepository(tx).takePendingRequest(),
      );
      expect(second?.id).toBe(b.id);
      release();
      await tx1;
    } finally {
      await conn2.sql.end();
    }
  });

  it('ignora los pedidos no pendientes', async () => {
    const { old, candidate } = await oldAndCandidate();
    const req = await requestFor(t.owner.db, old.id);
    await t.owner.db
      .update(generationRequests)
      .set({ status: 'done', newChallengeId: candidate.id, processedAt: new Date() })
      .where(eq(generationRequests.id, req.id));
    expect(await new ChallengePublishingRepository(t.svc.db).takePendingRequest()).toBeNull();
  });
});

describe('replaceChallenge / cancelCandidate', () => {
  it('reemplaza en orden, deja un solo vigente y actualiza last_used', async () => {
    const { old, candidate } = await oldAndCandidate();
    const req = await requestFor(t.owner.db, old.id);
    await t.svc.db.transaction((tx) =>
      new ChallengePublishingRepository(tx).replaceChallenge({
        requestId: req.id,
        oldId: old.id,
        candidate,
        date: D,
      }),
    );
    const rows = await t.owner.db.select().from(challenges);
    expect(rows.filter((r) => r.status === 'approved').map((r) => r.id)).toEqual([candidate.id]);
    const oldRow = rows.find((r) => r.id === old.id)!;
    expect(oldRow.status).toBe('rejected');
    expect(oldRow.verification).toMatchObject({ ok: true, reason: 'regenerated' });
    const [reqRow] = await t.owner.db.select().from(generationRequests);
    expect(reqRow).toMatchObject({ status: 'done', newChallengeId: candidate.id });
    expect(reqRow!.processedAt).not.toBeNull();
    const used = await t.owner.db.select().from(terms).where(eq(terms.id, candidate.itemIds[0]!));
    expect(used[0]!.lastUsedDevdle).toBe(D);
  });

  it('GREATEST no retrocede last_used', async () => {
    const { old, candidate } = await oldAndCandidate();
    await t.owner.db
      .update(terms)
      .set({ lastUsedDevdle: '2026-12-10' })
      .where(eq(terms.id, candidate.itemIds[0]!));
    const req = await requestFor(t.owner.db, old.id);
    await new ChallengePublishingRepository(t.svc.db).replaceChallenge({
      requestId: req.id,
      oldId: old.id,
      candidate,
      date: D,
    });
    const [row] = await t.owner.db.select().from(terms).where(eq(terms.id, candidate.itemIds[0]!));
    expect(row!.lastUsedDevdle).toBe('2026-12-10');
  });

  it('cancelCandidate rechaza el nuevo, cancela el pedido y no toca el viejo', async () => {
    const { old, candidate } = await oldAndCandidate();
    const req = await requestFor(t.owner.db, old.id);
    await new ChallengePublishingRepository(t.svc.db).cancelCandidate(req.id, candidate);
    const rows = await t.owner.db.select().from(challenges);
    expect(rows.find((r) => r.id === old.id)!.status).toBe('approved');
    const nuevo = rows.find((r) => r.id === candidate.id)!;
    expect(nuevo.status).toBe('rejected');
    expect(nuevo.verification).toMatchObject({ ok: true, reason: 'request_cancelled' });
    const [reqRow] = await t.owner.db.select().from(generationRequests);
    expect(reqRow).toMatchObject({ status: 'cancelled', newChallengeId: null });
    expect(reqRow!.processedAt).not.toBeNull();
  });
});
