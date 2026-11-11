import { randomUUID } from 'node:crypto';

import { plays, players } from '@nerdose/db';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
const sql = dbs.owner.sql;
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };
let ipSeq = 0;
const report = (app: App, player: { id: string }, reason: string, path = 'devdle') =>
  app.request(`/api/games/${path}/today/report`, {
    method: 'POST',
    headers: {
      ...MUTATION_HEADERS,
      Cookie: `nd_pid=${player.id}`,
      'x-forwarded-for': `198.51.100.${(ipSeq += 1) % 250}`,
    },
    body: JSON.stringify({ challenge_number: 8, reason }),
  });

const publish = (extra: Record<string, unknown> = {}) =>
  dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    payload: PAYLOAD,
    status: 'published',
    ...extra,
  });

/** Crea `n` jugadores en lote con el owner. */
async function manyPlayers(n: number) {
  const values = Array.from({ length: n }, () => ({ id: randomUUID() }));
  await dbs.owner.db.insert(players).values(values);
  return values;
}

/** `n` Play terminadas del desafío (jugadores nuevos). */
async function finishedPlays(challengeId: string, n: number) {
  const ps = await manyPlayers(n);
  await dbs.owner.db.insert(plays).values(
    ps.map((p, i) => ({
      playerId: p.id,
      challengeId,
      gameId: 'devdle' as const,
      date: '2026-12-01',
      state: {},
      status: (i % 2 ? 'won' : 'lost') as 'won' | 'lost',
      result: {},
      score: 1,
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    })),
  );
}

async function priorReports(challengeId: string, n: number, reason = 'wrong_answer') {
  const ps = await manyPlayers(n);
  for (const p of ps) {
    await dbs.insertReport({ challengeId, playerId: p.id, reason: reason as never });
  }
}

const alerted = async () => (await sql`SELECT alerted_at FROM challenges`)[0]!.alerted_at;
const thresholdLogs = (lines: () => Array<Record<string, unknown>>) =>
  lines().filter((l) => l.event === 'ReportThresholdReached');

describe('report: umbral', () => {
  it('TS-10 umbral por cantidad y TS-11 no re-alerta', async () => {
    const c = await publish();
    await finishedPlays(c.id, 200);
    await priorReports(c.id, 2);
    const { app, lines } = await buildDbApp(dbs);
    const third = await dbs.insertPlayer();
    expect((await report(app, third, 'wrong_answer')).status).toBe(201);
    const first = await alerted();
    expect(first).not.toBeNull();
    expect((await sql`SELECT status FROM challenges`)[0]!.status).toBe('published');
    expect(thresholdLogs(lines)).toEqual([
      expect.objectContaining({ challenge_id: c.id, report_count: 3, ratio: 0.015 }),
    ]);

    const fourth = await dbs.insertPlayer();
    expect((await report(app, fourth, 'ambiguous')).status).toBe(201);
    expect(await alerted()).toEqual(first);
    expect(thresholdLogs(lines)).toHaveLength(1);
  });

  it('TS-12 proporción sin superar 5%', async () => {
    const c = await publish();
    await finishedPlays(c.id, 40);
    await priorReports(c.id, 1, 'ambiguous');
    const { app } = await buildDbApp(dbs);
    expect((await report(app, await dbs.insertPlayer(), 'wrong_answer')).status).toBe(201);
    expect(await alerted()).toBeNull();
    expect((await report(app, await dbs.insertPlayer(), 'wrong_answer')).status).toBe(201);
    expect(await alerted()).not.toBeNull();
  });

  it('TS-13 proporción que supera 5%', async () => {
    const c = await publish();
    await finishedPlays(c.id, 20);
    await priorReports(c.id, 1);
    const { app, lines } = await buildDbApp(dbs);
    expect((await report(app, await dbs.insertPlayer(), 'ambiguous')).status).toBe(201);
    expect(await alerted()).not.toBeNull();
    expect(thresholdLogs(lines)[0]).toMatchObject({ report_count: 2, ratio: 0.1 });
  });

  it('TS-14 sin Play terminadas no hay proporción', async () => {
    const c = await publish();
    const ps = await manyPlayers(3);
    await dbs.insertPlay({
      playerId: ps[0]!.id,
      challengeId: c.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: {},
    });
    await priorReports(c.id, 1);
    const { app } = await buildDbApp(dbs);
    expect((await report(app, await dbs.insertPlayer(), 'wrong_answer')).status).toBe(201);
    expect(await alerted()).toBeNull();
  });

  it('TS-15 solo cuentan wrong_answer y ambiguous', async () => {
    const c = await publish();
    await finishedPlays(c.id, 200);
    for (const reason of ['other', 'display_bug', 'wrong_explanation']) {
      await priorReports(c.id, 1, reason);
    }
    const { app } = await buildDbApp(dbs);
    expect((await report(app, await dbs.insertPlayer(), 'wrong_answer')).status).toBe(201);
    expect(await alerted()).toBeNull();
  });

  it('TS-16 50 reportes no anulan: el desafío sigue aceptando jugadas', async () => {
    const c = await publish();
    await priorReports(c.id, 49);
    const { app } = await buildDbApp(dbs);
    expect((await report(app, await dbs.insertPlayer(), 'wrong_answer')).status).toBe(201);
    const row = (await sql`SELECT status, void_reason FROM challenges`)[0]!;
    expect(row).toMatchObject({ status: 'published', void_reason: null });
    const other = await dbs.insertPlayer();
    const move = await app.request('/api/games/devdle/today/move', {
      method: 'POST',
      headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${other.id}` },
      body: JSON.stringify({ challenge_number: 8, move: { guess: 'CACHE' } }),
    });
    expect(move.status).toBe(200);
    expect((await move.json()).play.status).toBe('in_progress');
  });

  it('TS-22 reporte sobre anulado no alerta', async () => {
    const c = await publish({
      status: 'voided',
      voidReason: 'wrong_answer',
      voidedAt: new Date('2026-12-01T09:00:00Z'),
    });
    await priorReports(c.id, 3);
    const { app, lines } = await buildDbApp(dbs);
    expect((await report(app, await dbs.insertPlayer(), 'wrong_answer')).status).toBe(201);
    expect(await alerted()).toBeNull();
    expect(thresholdLogs(lines)).toHaveLength(0);
  });

  it('TS-24 dos reportes concurrentes en el umbral: una sola marca y un solo evento', async () => {
    const c = await publish();
    await finishedPlays(c.id, 200);
    await priorReports(c.id, 2);
    const { app, lines } = await buildDbApp(dbs);
    const a = await dbs.insertPlayer();
    const b = await dbs.insertPlayer();
    const res = await Promise.all([report(app, a, 'wrong_answer'), report(app, b, 'wrong_answer')]);
    expect(res.map((r) => r.status)).toEqual([201, 201]);
    expect(await sql`SELECT id FROM challenge_reports`).toHaveLength(4);
    expect(await alerted()).not.toBeNull();
    expect(thresholdLogs(lines)).toHaveLength(1);
  });
});
