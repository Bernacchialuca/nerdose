import { challenges, jobRuns, terms, timelineFacts } from '@nerdose/db';
import { payloadSchema } from '@nerdose/game-timeline/definition';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { syncBanks } from '@/domain/content-banks/sync-banks.service';
import { createGeneratorRegistry, generatorRegistry } from '@/games/registry';
import { fillJob } from '@/scheduler/jobs/fill.job';
import { runJob } from '@/scheduler/run-job';

import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

const SECRET = 'test-secret-0123456789abcdef0123456789';
const t = setupTestDb();
const timelineOnly = createGeneratorRegistry([generatorRegistry.get('timeline')]);

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

const approved = (gameId: 'devdle' | 'grep-grid' | 'timeline') =>
  t.owner.db
    .select()
    .from(challenges)
    .where(and(eq(challenges.gameId, gameId), eq(challenges.status, 'approved')))
    .orderBy(asc(challenges.date));
const lastRun = async () => (await t.owner.db.select().from(jobRuns)).at(-1)!;
const factIds = (payload: unknown) => payloadSchema.parse(payload).items.map((i) => i.fact_id);
const dayOf = (i: number) => `2026-12-${String(i + 2).padStart(2, '0')}`;

beforeAll(async () => {
  await t.reset();
  await syncBanks({ db: t.svc.db, log: captureLogger().logger });
});
afterAll(() => t.cleanup());

describe('fill con Timeline y el dataset real', () => {
  it('rellena 13 días, genera solo today+14 al día siguiente y es idempotente', async () => {
    expect(
      await run({ now: '2026-11-30T12:00:00.000Z', launch: '2026-12-02', registry: timelineOnly }),
    ).toBe('success');
    const rows = await approved('timeline');
    expect(rows.map((r) => r.date)).toEqual(Array.from({ length: 13 }, (_, i) => dayOf(i)));
    expect(rows.map((r) => r.number)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
    rows.forEach((r) => expect(r.generatorVersion).toBe('timeline@1'));
    const all = await t.owner.db.select().from(challenges);
    expect(all.filter((r) => r.date <= '2026-12-01')).toHaveLength(0);

    const facts = await t.owner.db
      .select()
      .from(timelineFacts)
      .where(eq(timelineFacts.status, 'approved'));
    const byId = new Map(facts.map((f) => [f.id, f]));
    const seen = new Set<string>();
    for (const r of rows) {
      const p = payloadSchema.parse(r.payload);
      expect(new Set(p.items.map((i) => i.fact_id)).size).toBe(5);
      for (const item of p.items) {
        const fact = byId.get(item.fact_id)!;
        expect(fact).toBeDefined();
        expect(fact.category).toBe(p.category);
        expect(fact.label).toBe(item.label);
        expect(fact.eventDate).toBe(item.event_date);
        expect(fact.datePrecision).toBe(item.date_precision);
        expect(fact.lastUsed).toBe(r.date);
        seen.add(item.fact_id);
      }
    }
    expect(seen.size).toBe(65);

    // Día siguiente: solo se genera 2026-12-15.
    expect(
      await run({ now: '2026-12-01T12:00:00.000Z', launch: '2026-12-02', registry: timelineOnly }),
    ).toBe('success');
    const summary = (await lastRun()).summary as Record<string, number>;
    expect(summary.approved).toBe(1);
    expect(summary.missing).toBe(0);
    expect(summary.generated).toBe(summary.approved! + summary.rejected!);
    const after = await approved('timeline');
    expect(after).toHaveLength(14);
    const last = after.at(-1)!;
    expect(last).toMatchObject({ date: '2026-12-15', number: 14, generatorVersion: 'timeline@1' });
    expect(
      (await t.owner.db.select().from(challenges)).filter((r) => r.date === '2026-12-01'),
    ).toHaveLength(0);
    const lastIds = factIds(last.payload);
    for (const r of rows)
      expect(factIds(r.payload).filter((id) => lastIds.includes(id))).toEqual([]);
    const factRows = await t.owner.db.select().from(timelineFacts);
    for (const id of lastIds) {
      expect(factRows.find((f) => f.id === id)?.lastUsed).toBe('2026-12-15');
    }
    (await t.owner.db.select().from(terms)).forEach((r) => {
      expect(r.lastUsedDevdle).toBeNull();
      expect(r.lastUsedGrep).toBeNull();
    });

    // Idempotente.
    const count = (await t.owner.db.select().from(challenges)).length;
    await run({ now: '2026-12-01T12:00:00.000Z', launch: '2026-12-02', registry: timelineOnly });
    expect((await lastRun()).summary).toEqual({
      generated: 0,
      approved: 0,
      rejected: 0,
      missing: 0,
    });
    expect((await t.owner.db.select().from(challenges)).length).toBe(count);
  });

  it('los tres juegos conviven en un fill sin pisar sus bancos', async () => {
    await t.reset();
    await syncBanks({ db: t.svc.db, log: captureLogger().logger });
    expect(
      await run({
        now: '2026-12-01T12:00:00.000Z',
        launch: '2026-11-20',
        registry: generatorRegistry,
      }),
    ).toBe('success');
    const devdle = await approved('devdle');
    const grep = await approved('grep-grid');
    const timeline = await approved('timeline');
    expect(devdle).toHaveLength(14);
    expect(grep).toHaveLength(14);
    expect(timeline).toHaveLength(14);
    expect(timeline.map((r) => r.date)).toEqual(Array.from({ length: 14 }, (_, i) => dayOf(i)));
    expect(((await lastRun()).summary as Record<string, number>).missing).toBe(0);

    const devdleMap = new Map(
      devdle.map((r) => [(r.payload as { term_id: string }).term_id, r.date]),
    );
    const grepMap = new Map<string, string>();
    for (const r of grep) {
      for (const w of (r.payload as { words: { term_id: string }[] }).words) {
        grepMap.set(w.term_id, r.date);
      }
    }
    for (const term of await t.owner.db.select().from(terms)) {
      expect(term.lastUsedDevdle).toBe(devdleMap.get(term.id) ?? null);
      expect(term.lastUsedGrep).toBe(grepMap.get(term.id) ?? null);
    }

    const factMap = new Map<string, string>();
    for (const r of timeline) for (const id of factIds(r.payload)) factMap.set(id, r.date);
    for (const fact of await t.owner.db.select().from(timelineFacts)) {
      expect(fact.lastUsed).toBe(factMap.get(fact.id) ?? null);
    }
  });
});
