import { challenges, jobRuns, terms } from '@nerdose/db';
import { payloadSchema as grepPayload } from '@nerdose/game-grep-grid/definition';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { syncBanks } from '@/domain/content-banks/sync-banks.service';
import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { createGeneratorRegistry, generatorRegistry } from '@/games/registry';
import { fillJob } from '@/scheduler/jobs/fill.job';
import { runJob } from '@/scheduler/run-job';

import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

const SECRET = 'test-secret-0123456789abcdef0123456789';
const t = setupTestDb();
const grepOnly = createGeneratorRegistry([generatorRegistry.get('grep-grid')]);

function run(options: {
  now: string;
  launch: string;
  registry: ReturnType<typeof createGeneratorRegistry>;
}) {
  const captured = captureLogger();
  const body = fillJob({
    db: t.svc.db,
    env: { GENERATOR_SECRET: SECRET, LAUNCH_DATE: options.launch, GENERATION_MAX_ATTEMPTS: 20 },
    registry: options.registry,
    repo: new ChallengePublishingRepository(t.svc.db),
  });
  return runJob('fill', body, {
    sql: t.svc.sql,
    db: t.svc.db,
    logger: captured.logger,
    clock: { now: () => new Date(options.now) },
    signal: new AbortController().signal,
  });
}

const approved = (gameId: 'devdle' | 'grep-grid') =>
  t.owner.db
    .select()
    .from(challenges)
    .where(and(eq(challenges.gameId, gameId), eq(challenges.status, 'approved')))
    .orderBy(asc(challenges.date));
const lastRun = async () => (await t.owner.db.select().from(jobRuns)).at(-1)!;
const grepIds = (payload: unknown) => grepPayload.parse(payload).words.map((w) => w.term_id);

beforeAll(async () => {
  await t.reset();
  await syncBanks({ db: t.svc.db, log: captureLogger().logger });
});
afterAll(() => t.cleanup());

describe('fill con Grep Grid y el dataset real', () => {
  it('rellena 13 días, genera solo today+14 al día siguiente y es idempotente', async () => {
    const first = '2026-11-30T12:00:00.000Z';
    expect(await run({ now: first, launch: '2026-12-02', registry: grepOnly })).toBe('success');
    const rows = await approved('grep-grid');
    expect(rows.map((r) => r.date)).toEqual(
      Array.from({ length: 13 }, (_, i) => `2026-12-${String(i + 2).padStart(2, '0')}`),
    );
    expect(rows.map((r) => r.number)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
    rows.forEach((r) => expect(r.generatorVersion).toBe('grep-grid@1'));
    const all = await t.owner.db.select().from(challenges);
    expect(all.filter((r) => r.date <= '2026-12-01')).toHaveLength(0);

    const approvedTerms = await t.owner.db.select().from(terms).where(eq(terms.status, 'approved'));
    const byId = new Map(approvedTerms.map((x) => [x.id, x.term]));
    const seen = new Set<string>();
    for (const r of rows) {
      const p = grepPayload.parse(r.payload);
      expect(new Set(p.words.map((w) => w.term_id)).size).toBe(8);
      for (const w of p.words) {
        expect(w.word).toMatch(/^[A-Z]{4,12}$/);
        expect(byId.get(w.term_id)).toBe(w.word);
        seen.add(w.term_id);
      }
    }
    expect(seen.size).toBe(104);

    // Día siguiente: solo se genera 2026-12-15.
    expect(
      await run({ now: '2026-12-01T12:00:00.000Z', launch: '2026-12-02', registry: grepOnly }),
    ).toBe('success');
    const summary = (await lastRun()).summary as Record<string, number>;
    const approvedCount = summary.approved!;
    expect(approvedCount).toBe(1);
    expect(summary.missing).toBe(0);
    expect(summary.generated).toBe(approvedCount + summary.rejected!);
    const after = await approved('grep-grid');
    expect(after).toHaveLength(14);
    const last = after.at(-1)!;
    expect(last).toMatchObject({ date: '2026-12-15', number: 14 });
    // Hoy (2026-12-01) nunca se genera, tampoco en la segunda corrida (TS-19).
    const allAfter = await t.owner.db.select().from(challenges);
    expect(allAfter.filter((r) => r.date === '2026-12-01')).toHaveLength(0);
    const lastIds = grepIds(last.payload);
    for (const r of rows) {
      expect(grepIds(r.payload).filter((id) => lastIds.includes(id))).toEqual([]);
    }
    const termRows = await t.owner.db.select().from(terms);
    for (const id of lastIds) {
      expect(termRows.find((x) => x.id === id)?.lastUsedGrep).toBe('2026-12-15');
    }

    // Idempotente.
    const count = (await t.owner.db.select().from(challenges)).length;
    await run({ now: '2026-12-01T12:00:00.000Z', launch: '2026-12-02', registry: grepOnly });
    expect((await lastRun()).summary).toEqual({
      generated: 0,
      approved: 0,
      rejected: 0,
      missing: 0,
    });
    expect((await t.owner.db.select().from(challenges)).length).toBe(count);
  });

  it('convive con Devdle sin pisar los last_used_*', async () => {
    await t.reset();
    await syncBanks({ db: t.svc.db, log: captureLogger().logger });
    expect(
      await run({
        now: '2026-12-01T12:00:00.000Z',
        launch: '2026-11-20',
        registry: createGeneratorRegistry([
          generatorRegistry.get('devdle'),
          generatorRegistry.get('grep-grid'),
        ]),
      }),
    ).toBe('success');
    const devdle = await approved('devdle');
    const grep = await approved('grep-grid');
    expect(devdle).toHaveLength(14);
    expect(grep).toHaveLength(14);
    expect(((await lastRun()).summary as Record<string, number>).missing).toBe(0);

    const devdleMap = new Map(
      devdle.map((r) => [(r.payload as { term_id: string }).term_id, r.date]),
    );
    const grepMap = new Map<string, string>();
    for (const r of grep) for (const id of grepIds(r.payload)) grepMap.set(id, r.date);

    for (const term of await t.owner.db.select().from(terms)) {
      expect(term.lastUsedDevdle).toBe(devdleMap.get(term.id) ?? null);
      expect(term.lastUsedGrep).toBe(grepMap.get(term.id) ?? null);
    }
  });
});
