import type { GameId } from '@nerdose/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminAuth, buildDbApp } from '../helpers/app';
import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const clock = (iso: string) => vi.setSystemTime(new Date(iso));
const metrics = async (q: string): Promise<Json> => {
  const { app } = await buildDbApp(dbs);
  const res = await app.request(`/api/admin/metrics?${q}`, { headers: await adminAuth() });
  expect(res.status).toBe(200);
  return res.json();
};
const at = (d: string) => new Date(`${d}T12:00:00Z`);

type G = GameId;
type Status = 'won' | 'lost' | 'voided' | 'in_progress';
const mk = (playerId: string, c: { id: string; gameId: G; date: string }, status: Status) => ({
  playerId,
  challengeId: c.id,
  gameId: c.gameId,
  date: c.date,
  state: {},
  status,
  ...(status === 'in_progress' ? {} : { result: {}, finishedAt: at(c.date) }),
});
const dev = (date: string, extra: Record<string, unknown> = {}) =>
  dbs.insertChallenge({ gameId: 'devdle', date, ...extra });

describe('GET /api/admin/metrics (CA)', () => {
  it('rango sin actividad devuelve listas vacías (S-053 TS-20)', async () => {
    clock('2026-12-10T10:00:00Z');
    const c = await dev('2026-12-05');
    const p = await dbs.insertPlayer();
    await dbs.insertPlay(mk(p.id, c, 'won'));
    await dbs.insertPlayerStats({
      playerId: p.id,
      globalStreak: 1,
      maxGlobalStreak: 1,
      lastActiveDate: '2026-12-05',
    });
    expect(await metrics('from=2026-11-01&to=2026-11-07')).toEqual({
      summary: { unique_players: 0, completed: 0, d1: null, d7: null },
      daily_players: [],
      retention: [],
      challenge_quality: [],
      streak_distribution: [
        { bucket: '0', players: 0 },
        { bucket: '1', players: 1 },
        { bucket: '2-6', players: 0 },
        { bucket: '7-29', players: 0 },
        { bucket: '30+', players: 0 },
      ],
    });
  });

  it('CA-1 jugadores diarios (S-053 TS-21)', async () => {
    clock('2026-12-02T10:00:00Z');
    const d = await dev('2026-12-01', { number: 8 });
    const b = await dbs.insertChallenge({ gameId: 'bug-hunt', date: '2026-12-01', number: 8 });
    const ps = await dbs.insertPlayers(150);
    await dbs.insertPlays([
      ...ps.slice(0, 120).map((p) => mk(p.id, d, 'in_progress')),
      ...ps.slice(70).map((p) => mk(p.id, b, 'in_progress')),
    ]);
    const r = await metrics('from=2026-12-01&to=2026-12-01');
    expect(r.daily_players).toEqual([
      { date: '2026-12-01', game_id: null, players: 150 },
      { date: '2026-12-01', game_id: 'devdle', players: 120 },
      { date: '2026-12-01', game_id: 'bug-hunt', players: 80 },
    ]);
    expect(r.summary).toMatchObject({ unique_players: 150, completed: 0 });
  });

  it('CA-2 retención d1 = 0.4 y d7 null (S-053 TS-22)', async () => {
    clock('2026-12-05T10:00:00Z');
    const c1 = await dev('2026-12-01');
    const c2 = await dev('2026-12-02');
    const ps = await dbs.insertPlayers(100);
    await dbs.insertPlays([
      ...ps.map((p) => mk(p.id, c1, 'won')),
      ...ps.slice(0, 40).map((p) => mk(p.id, c2, 'lost')),
    ]);
    const r = await metrics('from=2026-12-01&to=2026-12-05');
    expect(r.retention).toEqual([
      { cohort_date: '2026-12-01', cohort_size: 100, d1: 0.4, d7: null },
    ]);
    expect(r.summary).toEqual({ unique_players: 100, completed: 140, d1: 0.4, d7: null });
  });

  it('CA-2 d7 se calcula cuando el día +7 terminó (S-053 TS-23)', async () => {
    clock('2026-12-09T10:00:00Z');
    const c1 = await dev('2026-12-01');
    const c2 = await dev('2026-12-02');
    const c8 = await dev('2026-12-08');
    const ps = await dbs.insertPlayers(100);
    await dbs.insertPlays([
      ...ps.map((p) => mk(p.id, c1, 'won')),
      ...ps.slice(0, 40).map((p) => mk(p.id, c2, 'lost')),
      ...ps.slice(0, 10).map((p) => mk(p.id, c8, 'won')),
    ]);
    const r = await metrics('from=2026-12-01&to=2026-12-01');
    expect(r.retention).toEqual([
      { cohort_date: '2026-12-01', cohort_size: 100, d1: 0.4, d7: 0.1 },
    ]);
    expect(r.summary).toMatchObject({ d1: 0.4, d7: 0.1 });
  });

  async function bigO() {
    const c = await dbs.insertChallenge({ gameId: 'big-o', date: '2026-12-01', number: 8 });
    const ps = await dbs.insertPlayers(300);
    const status = (i: number): Status => (i < 23 ? 'won' : i < 290 ? 'lost' : 'in_progress');
    await dbs.insertPlays(ps.map((p, i) => mk(p.id, { ...c, gameId: 'big-o' }, status(i))));
    await dbs.insertReport({ challengeId: c.id, playerId: ps[0]!.id });
    await dbs.insertReport({ challengeId: c.id, playerId: ps[1]!.id });
    return { c, ps };
  }

  it('CA-3 calidad de Big O #8 (S-053 TS-24)', async () => {
    clock('2026-12-02T10:00:00Z');
    const { c } = await bigO();
    const r = await metrics('from=2026-12-01&to=2026-12-01');
    expect(r.challenge_quality).toHaveLength(1);
    const row = r.challenge_quality[0];
    expect(row).toMatchObject({
      challenge_id: c.id,
      game_id: 'big-o',
      date: '2026-12-01',
      number: 8,
      started: 300,
      finished: 290,
      reports: 2,
      status: 'published',
    });
    expect(row.completion_rate).toBeCloseTo(0.967, 3);
    expect(row.win_rate).toBeCloseTo(0.079, 3);
  });

  it('CA-3 desafío anulado (S-053 TS-25)', async () => {
    clock('2026-12-02T10:00:00Z');
    const c = await dev('2026-12-01', {
      number: 8,
      status: 'voided',
      voidReason: 'wrong_answer',
      voidedAt: new Date('2026-12-01T15:00:00Z'),
    });
    const ps = await dbs.insertPlayers(3);
    await dbs.insertPlays(ps.map((p) => ({ ...mk(p.id, c, 'voided'), result: {} })));
    await dbs.insertReport({ challengeId: c.id, playerId: ps[0]!.id });
    const r = await metrics('from=2026-12-01&to=2026-12-01');
    expect(r.challenge_quality).toEqual([
      expect.objectContaining({
        game_id: 'devdle',
        started: 3,
        finished: 0,
        completion_rate: 0,
        win_rate: null,
        reports: 1,
        status: 'voided',
      }),
    ]);
    expect(r.summary.completed).toBe(3);
  });

  async function streakData() {
    await dev('2026-12-07');
    await dev('2026-12-10');
    const [p0, p1, p3, p10, p45] = await dbs.insertPlayers(5);
    void p0;
    const stats = (playerId: string, g: number, max: number, last: string) =>
      dbs.insertPlayerStats({
        playerId,
        globalStreak: g,
        maxGlobalStreak: max,
        lastActiveDate: last,
      });
    await stats(p1!.id, 1, 1, '2026-12-07');
    await stats(p3!.id, 3, 3, '2026-12-10');
    await stats(p10!.id, 10, 12, '2026-12-07');
    await stats(p45!.id, 45, 45, '2026-12-07');
  }

  it('CA-4 un jugador por tramo (S-053 TS-26)', async () => {
    clock('2026-12-10T10:00:00Z');
    await streakData();
    const r = await metrics('from=2026-12-01&to=2026-12-10');
    expect(r.streak_distribution).toEqual([
      { bucket: '0', players: 1 },
      { bucket: '1', players: 1 },
      { bucket: '2-6', players: 1 },
      { bucket: '7-29', players: 1 },
      { bucket: '30+', players: 1 },
    ]);
  });

  it('CA-4 racha no viva pasa a 0 y no depende del rango (S-053 TS-27)', async () => {
    clock('2026-12-10T10:00:00Z');
    await streakData();
    await dev('2026-12-05');
    const dead = await dbs.insertPlayer();
    await dbs.insertPlayerStats({
      playerId: dead.id,
      globalStreak: 5,
      maxGlobalStreak: 5,
      lastActiveDate: '2026-12-05',
    });
    const expected = [
      { bucket: '0', players: 2 },
      { bucket: '1', players: 1 },
      { bucket: '2-6', players: 1 },
      { bucket: '7-29', players: 1 },
      { bucket: '30+', players: 1 },
    ];
    expect((await metrics('from=2026-12-01&to=2026-12-10')).streak_distribution).toEqual(expected);
    expect((await metrics('from=2026-11-01&to=2026-11-02')).streak_distribution).toEqual(expected);
  });

  it('CA-5 summary de un rango con varias fechas (S-053 TS-28)', async () => {
    clock('2026-12-10T10:00:00Z');
    const c0 = await dev('2026-11-30');
    const c1 = await dev('2026-12-01');
    const c2 = await dev('2026-12-02');
    const c3 = await dev('2026-12-03');
    const [a, b, c, d] = await dbs.insertPlayers(4);
    await dbs.insertPlays([
      mk(a!.id, c1, 'won'),
      mk(a!.id, c2, 'won'),
      mk(b!.id, c2, 'lost'),
      mk(c!.id, c3, 'in_progress'),
      mk(d!.id, c0, 'won'),
    ]);
    const r = await metrics('from=2026-12-01&to=2026-12-03');
    expect(r.summary).toEqual({ unique_players: 3, completed: 3, d1: 0.5, d7: 0 });
  });

  it('ninguna columna expone player_id (S-053 TS-29)', async () => {
    clock('2026-12-02T10:00:00Z');
    const { ps } = await bigO();
    const r = await metrics('from=2026-12-01&to=2026-12-01');
    const text = JSON.stringify(r);
    expect(text).not.toContain('player_id');
    for (const p of ps) expect(text).not.toContain(p.id);
    expect(Object.keys(r.challenge_quality[0]).sort()).toEqual(
      [
        'challenge_id',
        'game_id',
        'date',
        'number',
        'started',
        'finished',
        'completion_rate',
        'win_rate',
        'reports',
        'status',
      ].sort(),
    );
    expect(Object.keys(r.retention[0]).sort()).toEqual(
      ['cohort_date', 'cohort_size', 'd1', 'd7'].sort(),
    );
  });

  it('límites inclusivos del rango en todas las listas (S-053 TS-30)', async () => {
    clock('2026-12-10T10:00:00Z');
    const days = ['2026-11-30', '2026-12-01', '2026-12-03', '2026-12-04'];
    const ps = await dbs.insertPlayers(days.length);
    const plays = [];
    for (const [i, d] of days.entries()) plays.push(mk(ps[i]!.id, await dev(d), 'won'));
    await dbs.insertPlays(plays);
    const r = await metrics('from=2026-12-01&to=2026-12-03');
    expect([...new Set(r.daily_players.map((x: Json) => x.date))]).toEqual([
      '2026-12-01',
      '2026-12-03',
    ]);
    expect(r.challenge_quality.map((x: Json) => x.date)).toEqual(['2026-12-03', '2026-12-01']);
    expect(r.retention.map((x: Json) => x.cohort_date)).toEqual(['2026-12-01', '2026-12-03']);
  });
});
