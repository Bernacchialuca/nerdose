import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { createDb } from '../src/client';
import type { Challenge } from '../src/index';
import { makeChallenge, makePlayer, truncateAll } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));
const api = connectAs(inject('apiUrl'));
const generator = connectAs(inject('generatorUrl'));
const { db: ownerDb, sql: ownerDbSql } = createDb(inject('ownerUrl'), { max: 1 });

const METRICS_VIEWS = [
  'metrics_daily_players',
  'metrics_retention',
  'metrics_streak_distribution',
  'metrics_challenge_quality',
] as const;

const PRIVS = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'TRUNCATE',
  'REFERENCES',
  'TRIGGER',
] as const;

const deniedView = (v: string) => ({
  code: '42501',
  message: `permission denied for view ${v}`,
});

beforeAll(async () => {
  await truncateAll({ sql: owner });
});

afterAll(async () => {
  await Promise.all([owner.end(), api.end(), generator.end(), ownerDbSql.end()]);
});

const viewColumns = async (view: string) => {
  const rows = await owner`SELECT column_name, udt_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${view} ORDER BY ordinal_position`;
  return rows.map((r) => [r.column_name, r.udt_name]);
};

type GameId = Challenge['gameId'];
type PlayStatus = 'in_progress' | 'won' | 'lost' | 'voided';

const challenges = new Map<string, Challenge>();
async function challengeFor(
  gameId: GameId,
  date: string,
  overrides: Partial<Parameters<typeof makeChallenge>[1]> = {},
): Promise<Challenge> {
  const key = `${gameId}|${date}`;
  const existing = challenges.get(key);
  if (existing) return existing;
  const created = await makeChallenge(ownerDb, { gameId, date, ...overrides });
  challenges.set(key, created);
  return created;
}

async function play(o: { playerId: string; challenge: Challenge; status: PlayStatus }) {
  await owner`INSERT INTO plays (player_id, challenge_id, game_id, date, state, status, result, finished_at)
    VALUES (${o.playerId}, ${o.challenge.id}, ${o.challenge.gameId}, ${o.challenge.date}, '{}'::jsonb,
      ${o.status},
      ${o.status === 'won' || o.status === 'lost' ? owner`'{"ok":true}'::jsonb` : owner`NULL`},
      ${o.status === 'in_progress' ? owner`NULL` : owner`now()`})`;
}

async function stats(playerId: string, streak: number, max: number, lastActive: string) {
  await owner`INSERT INTO player_stats (player_id, global_streak, max_global_streak, last_active_date)
    VALUES (${playerId}, ${streak}, ${max}, ${lastActive})`;
}

async function report(challengeId: string, playerId: string) {
  await owner`INSERT INTO challenge_reports (challenge_id, player_id, reason, locale, context)
    VALUES (${challengeId}, ${playerId}, 'wrong_answer', 'es', '{}'::jsonb)`;
}

const newPlayer = async () => (await makePlayer(ownerDb)).id;

describe('metrics views structure', () => {
  it('S052-TS-2: exactly the 4 views exist, owned by nerdose_owner', async () => {
    const rows = await owner`SELECT viewname, viewowner FROM pg_views
      WHERE schemaname = 'public' AND viewname LIKE 'metrics\\_%' ORDER BY viewname`;
    expect(rows.map((r) => [r.viewname, r.viewowner])).toEqual([
      ['metrics_challenge_quality', 'nerdose_owner'],
      ['metrics_daily_players', 'nerdose_owner'],
      ['metrics_retention', 'nerdose_owner'],
      ['metrics_streak_distribution', 'nerdose_owner'],
    ]);
  });

  it('S052-TS-3: metrics_daily_players columns', async () => {
    expect(await viewColumns('metrics_daily_players')).toEqual([
      ['date', 'date'],
      ['game_id', 'game_id'],
      ['players', 'int4'],
    ]);
  });

  it('S052-TS-4: metrics_retention columns', async () => {
    expect(await viewColumns('metrics_retention')).toEqual([
      ['cohort_date', 'date'],
      ['cohort_size', 'int4'],
      ['d1_players', 'int4'],
      ['d7_players', 'int4'],
    ]);
  });

  it('S052-TS-5: metrics_streak_distribution columns', async () => {
    expect(await viewColumns('metrics_streak_distribution')).toEqual([
      ['bucket', 'text'],
      ['last_active_date', 'date'],
      ['players', 'int4'],
    ]);
  });

  it('S052-TS-6: metrics_challenge_quality columns (no player_id)', async () => {
    expect(await viewColumns('metrics_challenge_quality')).toEqual([
      ['challenge_id', 'uuid'],
      ['game_id', 'game_id'],
      ['date', 'date'],
      ['number', 'int4'],
      ['started', 'int4'],
      ['finished', 'int4'],
      ['completion_rate', 'float8'],
      ['win_rate', 'float8'],
      ['reports', 'int4'],
      ['status', 'challenge_status'],
    ]);
  });
});

describe('metrics views permissions', () => {
  it.each(
    METRICS_VIEWS.flatMap((v) =>
      (['nerdose_api', 'nerdose_generator'] as const).map((r) => [v, r]),
    ),
  )('S052-TS-7: privilege matrix of %s for %s', async (view, role) => {
    const allowed = role === 'nerdose_api' ? ['SELECT'] : [];
    for (const p of PRIVS) {
      const [row] = await owner`SELECT has_table_privilege(${role!}, ${view!}, ${p}) AS ok`;
      expect([p, row!.ok]).toEqual([p, allowed.includes(p)]);
    }
  });

  // unsafe: the view name comes from the local constant, never from external input
  it.each(METRICS_VIEWS)('S052-TS-8: nerdose_api can read %s', async (view) => {
    expect(Array.isArray(await api.unsafe(`SELECT * FROM ${view} LIMIT 1`))).toBe(true);
  });

  // unsafe: the view name comes from the local constant, never from external input
  it.each(METRICS_VIEWS)('S052-TS-9: nerdose_generator cannot read %s', async (view) => {
    await expect(generator.unsafe(`SELECT 1 FROM ${view}`)).rejects.toMatchObject(deniedView(view));
  });

  // PostgreSQL rejects writes on aggregate views (55000) before checking privileges; TS-7 proves the missing grants
  it('S052-TS-10: nerdose_api cannot write the views', async () => {
    await expect(
      api`INSERT INTO metrics_daily_players (date, game_id, players) VALUES ('2032-01-01', 'devdle', 1)`,
    ).rejects.toMatchObject({ code: '55000' });
    await expect(api`DELETE FROM metrics_challenge_quality`).rejects.toMatchObject({
      code: '55000',
    });
  });
});

describe('metrics_daily_players', () => {
  it('S052-TS-15: total counts distinct players, per game counts any status', async () => {
    const d = '2032-03-01';
    const cd = await challengeFor('devdle', d);
    const cb = await challengeFor('bug-hunt', d);
    const [p1, p2, p3] = [await newPlayer(), await newPlayer(), await newPlayer()] as [
      string,
      string,
      string,
    ];
    await play({ playerId: p1, challenge: cd, status: 'won' });
    await play({ playerId: p1, challenge: cb, status: 'in_progress' });
    await play({ playerId: p2, challenge: cd, status: 'lost' });
    await play({ playerId: p3, challenge: cb, status: 'voided' });
    const rows = await api`SELECT date::text AS date, game_id, players FROM metrics_daily_players
      WHERE date = '2032-03-01' ORDER BY game_id NULLS FIRST`;
    expect([...rows]).toEqual([
      { date: d, game_id: null, players: 3 },
      { date: d, game_id: 'devdle', players: 2 },
      { date: d, game_id: 'bug-hunt', players: 2 },
    ]);
  });

  it('S052-TS-16: a day without plays has no rows', async () => {
    const rows = await api`SELECT * FROM metrics_daily_players WHERE date = '2032-03-02'`;
    expect(rows).toEqual([]);
  });
});

describe('metrics_retention', () => {
  it('S052-TS-17: cohort with D1/D7 counts', async () => {
    const d1 = '2032-04-01';
    const d2 = '2032-04-02';
    const d8 = '2032-04-08';
    const dev = [
      await challengeFor('devdle', d1),
      await challengeFor('devdle', d2),
      await challengeFor('devdle', d8),
    ] as [Challenge, Challenge, Challenge];
    const grep2 = await challengeFor('grep-grid', d2);
    const [a, b, c, d] = [
      await newPlayer(),
      await newPlayer(),
      await newPlayer(),
      await newPlayer(),
    ] as [string, string, string, string];
    await play({ playerId: a, challenge: dev[0], status: 'won' });
    await play({ playerId: a, challenge: dev[1], status: 'won' });
    await play({ playerId: a, challenge: grep2, status: 'lost' });
    await play({ playerId: a, challenge: dev[2], status: 'won' });
    await play({ playerId: b, challenge: dev[0], status: 'lost' });
    await play({ playerId: b, challenge: dev[1], status: 'won' });
    await play({ playerId: c, challenge: dev[0], status: 'won' });
    await play({ playerId: c, challenge: dev[2], status: 'voided' });
    await play({ playerId: d, challenge: dev[0], status: 'won' });
    const rows =
      await api`SELECT cohort_date::text AS cohort_date, cohort_size, d1_players, d7_players
      FROM metrics_retention WHERE cohort_date = '2032-04-01'`;
    expect([...rows]).toEqual([{ cohort_date: d1, cohort_size: 4, d1_players: 2, d7_players: 2 }]);
  });

  it('S052-TS-18: cohort is the first completed play, in_progress does not define it', async () => {
    const c12 = await challengeFor('devdle', '2032-04-12');
    const c13 = await challengeFor('devdle', '2032-04-13');
    const e = await newPlayer();
    await play({ playerId: e, challenge: c12, status: 'in_progress' });
    await play({ playerId: e, challenge: c13, status: 'won' });
    const rows =
      await api`SELECT cohort_date::text AS cohort_date, cohort_size, d1_players, d7_players
      FROM metrics_retention WHERE cohort_date BETWEEN '2032-04-12' AND '2032-04-13' ORDER BY cohort_date`;
    expect([...rows]).toEqual([
      { cohort_date: '2032-04-13', cohort_size: 1, d1_players: 0, d7_players: 0 },
    ]);
  });

  it('S052-TS-19: without "today", missing +1/+7 give 0, not null', async () => {
    const c = await challengeFor('devdle', '2032-04-20');
    await play({ playerId: await newPlayer(), challenge: c, status: 'won' });
    const rows =
      await api`SELECT cohort_date::text AS cohort_date, cohort_size, d1_players, d7_players
      FROM metrics_retention WHERE cohort_date = '2032-04-20'`;
    expect([...rows]).toEqual([
      { cohort_date: '2032-04-20', cohort_size: 1, d1_players: 0, d7_players: 0 },
    ]);
  });

  it('S052-TS-20: a player with only in_progress plays forms no cohort', async () => {
    const c = await challengeFor('devdle', '2032-04-25');
    await play({ playerId: await newPlayer(), challenge: c, status: 'in_progress' });
    const rows = await api`SELECT * FROM metrics_retention WHERE cohort_date = '2032-04-25'`;
    expect(rows).toEqual([]);
  });
});

describe('metrics_streak_distribution', () => {
  it('S052-TS-21: one player per bucket using the stored streak', async () => {
    const cases: [number, number, string][] = [
      [0, 3, '2032-05-01'],
      [1, 1, '2032-05-02'],
      [3, 3, '2032-05-03'],
      [10, 10, '2032-05-04'],
      [45, 45, '2032-05-05'],
    ];
    for (const [s, m, d] of cases) await stats(await newPlayer(), s, m, d);
    const rows = await api`SELECT bucket, last_active_date::text AS last_active_date, players
      FROM metrics_streak_distribution
      WHERE last_active_date BETWEEN '2032-05-01' AND '2032-05-05' ORDER BY last_active_date`;
    expect([...rows]).toEqual([
      { bucket: '0', last_active_date: '2032-05-01', players: 1 },
      { bucket: '1', last_active_date: '2032-05-02', players: 1 },
      { bucket: '2-6', last_active_date: '2032-05-03', players: 1 },
      { bucket: '7-29', last_active_date: '2032-05-04', players: 1 },
      { bucket: '30+', last_active_date: '2032-05-05', players: 1 },
    ]);
  });

  it.each([
    [2, '2-6', '2032-05-10'],
    [6, '2-6', '2032-05-11'],
    [7, '7-29', '2032-05-12'],
    [29, '7-29', '2032-05-13'],
    [30, '30+', '2032-05-14'],
  ] as const)('S052-TS-22: boundary streak %i falls in %s', async (s, bucket, date) => {
    await stats(await newPlayer(), s, s, date);
    const rows = await api`SELECT bucket, players FROM metrics_streak_distribution
      WHERE last_active_date = ${date}`;
    expect([...rows]).toEqual([{ bucket, players: 1 }]);
  });

  it('S052-TS-23: a player without player_stats counts in 0 with null last_active_date', async () => {
    const q = async () => {
      const [row] = await api`SELECT coalesce(sum(players), 0)::int AS n
        FROM metrics_streak_distribution WHERE bucket = '0' AND last_active_date IS NULL`;
      return row!.n as number;
    };
    const before = await q();
    await makePlayer(ownerDb);
    expect(await q()).toBe(before + 1);
  });

  it('S052-TS-24: groups by (bucket, last_active_date)', async () => {
    await stats(await newPlayer(), 4, 4, '2032-05-20');
    await stats(await newPlayer(), 4, 4, '2032-05-20');
    await stats(await newPlayer(), 4, 4, '2032-05-21');
    const rows = await api`SELECT bucket, last_active_date::text AS last_active_date, players
      FROM metrics_streak_distribution
      WHERE last_active_date IN ('2032-05-20','2032-05-21') ORDER BY last_active_date`;
    expect([...rows]).toEqual([
      { bucket: '2-6', last_active_date: '2032-05-20', players: 2 },
      { bucket: '2-6', last_active_date: '2032-05-21', players: 1 },
    ]);
  });

  it('S052-TS-25: the view does not apply the live streak', async () => {
    await stats(await newPlayer(), 10, 10, '2020-01-01');
    const rows = await api`SELECT bucket, last_active_date::text AS last_active_date, players
      FROM metrics_streak_distribution WHERE last_active_date = '2020-01-01'`;
    expect([...rows]).toEqual([{ bucket: '7-29', last_active_date: '2020-01-01', players: 1 }]);
  });
});

describe('metrics_challenge_quality', () => {
  const quality = (id: string) => api`SELECT challenge_id, game_id, date::text AS date, number,
    started, finished, completion_rate, win_rate, reports, status
    FROM metrics_challenge_quality WHERE challenge_id = ${id}`;

  it('S052-TS-26: counts and rates without multiplying rows by the reports join', async () => {
    const c = await challengeFor('big-o', '2032-06-01', { number: 8 });
    const ps: string[] = [];
    for (let i = 0; i < 6; i++) ps.push(await newPlayer());
    const statuses: PlayStatus[] = ['won', 'won', 'won', 'lost', 'lost', 'in_progress'];
    for (const [i, s] of statuses.entries()) {
      await play({ playerId: ps[i]!, challenge: c, status: s });
    }
    await report(c.id, ps[0]!);
    await report(c.id, ps[1]!);
    const [row] = await quality(c.id);
    expect(row).toMatchObject({
      challenge_id: c.id,
      game_id: 'big-o',
      date: '2032-06-01',
      number: 8,
      started: 6,
      finished: 5,
      reports: 2,
      status: 'published',
    });
    expect(row!.completion_rate).toBeCloseTo(5 / 6, 10);
    expect(row!.win_rate).toBeCloseTo(0.6, 10);
    expect(typeof row!.completion_rate).toBe('number');
    expect(typeof row!.started).toBe('number');
  });

  it('S052-TS-27: voided plays count neither in finished nor in win_rate', async () => {
    const c = await challengeFor('devdle', '2032-06-02', {
      number: 9,
      status: 'voided',
      voidReason: 'bad',
      voidedAt: new Date(),
    });
    const ps = [await newPlayer(), await newPlayer(), await newPlayer()] as [
      string,
      string,
      string,
    ];
    for (const p of ps) await play({ playerId: p, challenge: c, status: 'voided' });
    await report(c.id, ps[0]);
    const [row] = await quality(c.id);
    expect(row).toMatchObject({
      started: 3,
      finished: 0,
      completion_rate: 0,
      win_rate: null,
      reports: 1,
      status: 'voided',
    });
  });

  it('S052-TS-28: no plays nor reports give null rates', async () => {
    const c = await challengeFor('timeline', '2032-06-03');
    const [row] = await quality(c.id);
    expect(row).toMatchObject({
      started: 0,
      finished: 0,
      completion_rate: null,
      win_rate: null,
      reports: 0,
      status: 'published',
    });
  });

  it('S052-TS-29: only losses give win_rate 0', async () => {
    const c = await challengeFor('grep-grid', '2032-06-04');
    await play({ playerId: await newPlayer(), challenge: c, status: 'lost' });
    await play({ playerId: await newPlayer(), challenge: c, status: 'lost' });
    const [row] = await quality(c.id);
    expect(row).toMatchObject({
      started: 2,
      finished: 2,
      completion_rate: 1,
      win_rate: 0,
      reports: 0,
    });
  });

  it('S052-TS-30: only in_progress gives completion_rate 0 and null win_rate', async () => {
    const c = await challengeFor('bug-hunt', '2032-06-05');
    await play({ playerId: await newPlayer(), challenge: c, status: 'in_progress' });
    await play({ playerId: await newPlayer(), challenge: c, status: 'in_progress' });
    const [row] = await quality(c.id);
    expect(row).toMatchObject({ started: 2, finished: 0, completion_rate: 0, win_rate: null });
  });

  it('S052-TS-31: lists only published and voided challenges', async () => {
    const a = await challengeFor('devdle', '2032-06-10', { status: 'approved' });
    const d = await challengeFor('devdle', '2032-06-11', { status: 'draft' });
    const r = await challengeFor('devdle', '2032-06-12', { status: 'rejected' });
    const rows = await api`SELECT * FROM metrics_challenge_quality
      WHERE challenge_id IN (${a.id}, ${d.id}, ${r.id})`;
    expect(rows).toEqual([]);
  });
});
