import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, expectTypeOf, inject, it } from 'vitest';

import type { CodeLanguage, GameId } from '@nerdose/core';

import { createDb } from '../src/client';
import { challenges, plays } from '../src/index';
import { makeChallenge, makePlayer, truncateAll } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));
const api = connectAs(inject('apiUrl'));
const { db: ownerDb, sql: ownerDbSql } = createDb(inject('ownerUrl'), { max: 1 });
const { db: apiDb, sql: apiDbSql } = createDb(inject('apiUrl'), { max: 1 });
const { db: generatorDb, sql: generatorDbSql } = createDb(inject('generatorUrl'), { max: 1 });

const insertPlay = (playerId: string, challengeId: string, gameId: string, extra = api``) =>
  api`INSERT INTO plays (player_id, challenge_id, game_id, date, state)
    VALUES (${playerId}, ${challengeId}, ${gameId}, '2026-12-01', '{"guesses":[]}') ${extra}`;

beforeAll(async () => {
  await truncateAll({ sql: owner });
});

afterAll(async () => {
  await Promise.all([
    owner.end(),
    api.end(),
    ownerDbSql.end(),
    apiDbSql.end(),
    generatorDbSql.end(),
  ]);
});

describe('plays', () => {
  it('S015-TS-26/27/28: one play per player and challenge', async () => {
    const p = await makePlayer(ownerDb);
    const p2 = await makePlayer(ownerDb);
    const c = await makeChallenge(ownerDb, { gameId: 'devdle', date: '2026-12-01' });
    const [first] = await insertPlay(p.id, c.id, 'devdle').then(
      () => api`SELECT status, started_at FROM plays WHERE player_id = ${p.id}`,
    );
    expect(first!.status).toBe('in_progress');
    expect(first!.started_at).toBeInstanceOf(Date);
    await expect(insertPlay(p.id, c.id, 'devdle')).rejects.toMatchObject({
      code: '23505',
      constraint_name: 'uq_plays_player_challenge',
    });
    const none = await insertPlay(
      p.id,
      c.id,
      'devdle',
      api`ON CONFLICT (player_id, challenge_id) DO NOTHING RETURNING id`,
    );
    expect(none).toHaveLength(0);
    await expect(insertPlay(p2.id, c.id, 'devdle')).resolves.toBeDefined();
  });

  it('S015-TS-29/30/31: result and finished_at checks', async () => {
    const p = await makePlayer(ownerDb);
    const c = await makeChallenge(ownerDb, { gameId: 'devdle', date: '2026-12-02' });
    const c2 = await makeChallenge(ownerDb, { gameId: 'grep-grid', date: '2026-12-02' });
    const c3 = await makeChallenge(ownerDb, { gameId: 'timeline', date: '2026-12-02' });
    await expect(
      api`INSERT INTO plays (player_id, challenge_id, game_id, date, state, status, finished_at)
        VALUES (${p.id}, ${c.id}, 'devdle', '2026-12-02', '{}', 'won', now())`,
    ).rejects.toMatchObject({ code: '23514', constraint_name: 'ck_plays_result_when_finished' });
    await expect(
      api`INSERT INTO plays (player_id, challenge_id, game_id, date, state, status, result)
        VALUES (${p.id}, ${c.id}, 'devdle', '2026-12-02', '{}', 'lost', '{"win":false}')`,
    ).rejects.toMatchObject({ code: '23514', constraint_name: 'ck_plays_finished_at' });
    await expect(
      api`INSERT INTO plays (player_id, challenge_id, game_id, date, state, status, finished_at)
        VALUES (${p.id}, ${c2.id}, 'grep-grid', '2026-12-02', '{}', 'voided', now())`,
    ).resolves.toBeDefined();
    expect(c3.id).toBeDefined();
  });

  it('S015-TS-32: code_language only for big-o and bug-hunt', async () => {
    const p = await makePlayer(ownerDb);
    const c = await makeChallenge(ownerDb, { gameId: 'devdle', date: '2026-12-03' });
    const c2 = await makeChallenge(ownerDb, { gameId: 'big-o', date: '2026-12-03' });
    await expect(
      api`INSERT INTO plays (player_id, challenge_id, game_id, date, state, code_language)
        VALUES (${p.id}, ${c.id}, 'devdle', '2026-12-03', '{}', 'js')`,
    ).rejects.toMatchObject({ code: '23514', constraint_name: 'ck_plays_code_language_game' });
    await expect(
      api`INSERT INTO plays (player_id, challenge_id, game_id, date, state, code_language)
        VALUES (${p.id}, ${c2.id}, 'big-o', '2026-12-03', '{}', 'go')`,
    ).resolves.toBeDefined();
  });

  it('S015-TS-33: unknown player violates the FK', async () => {
    const c = await makeChallenge(ownerDb, { gameId: 'devdle', date: '2026-12-04' });
    await expect(insertPlay(randomUUID(), c.id, 'devdle')).rejects.toMatchObject({ code: '23503' });
  });
});

describe('rejected_guesses and aggregates', () => {
  it('S015-TS-36/37: word format and primary key', async () => {
    const p = await makePlayer(ownerDb);
    await api`INSERT INTO rejected_guesses (word, player_id) VALUES ('ABCDE', ${p.id})`;
    for (const word of ['abcde', 'AB1', '']) {
      await expect(
        api`INSERT INTO rejected_guesses (word, player_id) VALUES (${word}, ${p.id})`,
      ).rejects.toMatchObject({ code: '23514', constraint_name: 'ck_rejected_guesses_word' });
    }
    await expect(
      api`INSERT INTO rejected_guesses (word, player_id) VALUES ('ABCDE', ${p.id})`,
    ).rejects.toMatchObject({
      code: '23505',
      constraint_name: 'rejected_guesses_word_player_id_pk',
    });
    await expect(
      api`INSERT INTO rejected_guesses (word, player_id) VALUES ('ABCDE', ${p.id}) ON CONFLICT DO NOTHING`,
    ).resolves.toBeDefined();
  });

  it('S015-TS-38: negative counters are rejected', async () => {
    const p = await makePlayer(ownerDb);
    await expect(
      api`INSERT INTO player_game_stats (player_id, game_id, played) VALUES (${p.id}, 'devdle', -1)`,
    ).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_player_game_stats_non_negative',
    });
    await expect(
      api`INSERT INTO player_stats (player_id, total_completed) VALUES (${p.id}, -1)`,
    ).rejects.toMatchObject({ code: '23514', constraint_name: 'ck_player_stats_non_negative' });
  });

  it('S015-TS-39: max streak below current streak is rejected', async () => {
    const p = await makePlayer(ownerDb);
    await expect(
      api`INSERT INTO player_game_stats (player_id, game_id, current_streak, max_streak) VALUES (${p.id}, 'devdle', 3, 2)`,
    ).rejects.toMatchObject({ code: '23514', constraint_name: 'ck_player_game_stats_max_streak' });
    await expect(
      api`INSERT INTO player_stats (player_id, global_streak, max_global_streak) VALUES (${p.id}, 5, 4)`,
    ).rejects.toMatchObject({ code: '23514', constraint_name: 'ck_player_stats_max_streak' });
  });

  it('S015-TS-40: closing-flow upserts accumulate', async () => {
    const p = await makePlayer(ownerDb);
    const extra = '{"guesses":{"1":0,"2":0,"3":1,"4":0,"5":0,"6":0},"losses":0}';
    for (let i = 0; i < 2; i++) {
      await api`INSERT INTO player_game_stats (player_id, game_id, current_streak, max_streak, played, wins, last_completed_date, extra)
        VALUES (${p.id}, 'devdle', 1, 1, 1, 1, '2026-12-01', ${extra}::text::jsonb)
        ON CONFLICT (player_id, game_id) DO UPDATE SET played = player_game_stats.played + 1`;
      await api`INSERT INTO player_stats (player_id, total_completed) VALUES (${p.id}, 1)
        ON CONFLICT (player_id) DO UPDATE SET total_completed = player_stats.total_completed + 1`;
    }
    const [g] = await owner`SELECT played FROM player_game_stats WHERE player_id = ${p.id}`;
    const [s] =
      await owner`SELECT total_completed, global_streak FROM player_stats WHERE player_id = ${p.id}`;
    expect(g!.played).toBe(2);
    expect(s!.total_completed).toBe(2);
    expect(s!.global_streak).toBe(0);
    const p2 = await makePlayer(ownerDb);
    await api`INSERT INTO player_game_stats (player_id, game_id) VALUES (${p2.id}, 'devdle')`;
    const [d] = await owner`SELECT extra FROM player_game_stats WHERE player_id = ${p2.id}`;
    expect(d!.extra).toEqual({});
  });
});

describe('typed access and helpers', () => {
  it('S015-TS-64: typed insert with the generator role', async () => {
    const [row] = await generatorDb
      .insert(challenges)
      .values({
        gameId: 'devdle',
        date: '2026-12-20',
        number: 50,
        payload: { word: 'KERNEL' },
        generatorVersion: '1',
        seed: 'ab',
        attempt: 0,
      })
      .returning();
    expect(row).toMatchObject({
      status: 'draft',
      verification: {},
      voidReason: null,
      date: '2026-12-20',
    });
    expect(row!.createdAt).toBeInstanceOf(Date);
  });

  it('S015-TS-65: typed insert of a play with the api role', async () => {
    const p = await makePlayer(ownerDb);
    const c = await makeChallenge(ownerDb, { gameId: 'devdle', date: '2026-12-05' });
    const [row] = await apiDb
      .insert(plays)
      .values({
        playerId: p.id,
        challengeId: c.id,
        gameId: 'devdle',
        date: '2026-12-01',
        state: { guesses: [] },
      })
      .returning();
    expect(row).toMatchObject({ status: 'in_progress', result: null, codeLanguage: null });
    expect(row!.startedAt).toBeInstanceOf(Date);
    expectTypeOf(row!.gameId).toEqualTypeOf<GameId>();
    expectTypeOf(row!.codeLanguage).toEqualTypeOf<CodeLanguage | null>();
  });

  it('S015-TS-66: makePlayer', async () => {
    const a = await makePlayer(ownerDb);
    const b = await makePlayer(ownerDb, { locale: 'en' });
    expect(a.id).toBeDefined();
    expect(b.locale).toBe('en');
  });

  it('S015-TS-67/68: makeChallenge defaults and overrides', async () => {
    const d = await makeChallenge(ownerDb, { gameId: 'devdle', date: '2026-12-21' });
    expect(d).toMatchObject({
      status: 'published',
      number: 1,
      payload: {},
      generatorVersion: 'test',
      seed: 'test',
      attempt: 0,
    });
    const o = await makeChallenge(ownerDb, {
      gameId: 'devdle',
      date: '2026-12-22',
      status: 'approved',
      number: 52,
      payload: { word: 'KERNEL' },
    });
    expect(o).toMatchObject({ status: 'approved', number: 52, payload: { word: 'KERNEL' } });
  });

  it('S015-TS-69: truncateAll empties the new tables', async () => {
    const p = await makePlayer(ownerDb);
    const c = await makeChallenge(ownerDb, { gameId: 'devdle', date: '2026-12-23' });
    await insertPlay(p.id, c.id, 'devdle');
    await owner`INSERT INTO terms (term, category, definition, summary, wikidata_id, sitelinks, status, dataset_version)
      VALUES ('KERNEL', 'linux', '{"es":"a","en":"b"}', '{"es":"a","en":"b"}', 'Q-trunc', 1, 'approved', 'v')`;
    await owner`INSERT INTO job_runs (job) VALUES ('fill')`;
    await truncateAll({ sql: owner });
    for (const t of ['players', 'challenges', 'plays', 'terms', 'job_runs']) {
      const [row] = await owner`SELECT count(*)::int AS n FROM ${owner(t)}`;
      expect(row!.n).toBe(0);
    }
  });
});
