import { scoreGuess } from '@nerdose/game-devdle/definition';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const g = (w: string) => ({ guess: w, marks: scoreGuess('MERGE', w) });
const FIVE = [g('REACT'), g('CACHE'), g('REACT'), g('CACHE'), g('REACT')];
const sql = dbs.owner.sql;

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };
const post = (app: App, player: { id: string }, w: string) =>
  app.request('/api/games/devdle/today/move', {
    method: 'POST',
    headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${player.id}` },
    body: JSON.stringify({ challenge_number: 8, move: { guess: w } }),
  });

async function seed(guesses: unknown[]) {
  const challenge = await dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    payload: PAYLOAD,
    status: 'published',
  });
  const player = await dbs.insertPlayer();
  await dbs.insertPlay({
    playerId: player.id,
    challengeId: challenge.id,
    gameId: 'devdle',
    date: '2026-12-01',
    state: { guesses },
  });
  return player;
}

describe('move: concurrencia y ROLLBACK', () => {
  it('TS-31 dos 6.º intentos concurrentes: un solo cierre', async () => {
    const player = await seed(FIVE);
    const { app, lines } = await buildDbApp(dbs);
    const res = await Promise.all([post(app, player, 'CACHE'), post(app, player, 'CACHE')]);
    expect(res.map((r) => r.status).sort()).toEqual([200, 409]);
    const ok = res.find((r) => r.status === 200)!;
    expect((await ok.json()).play.status).toBe('lost');
    const [p] = await sql`SELECT state FROM plays`;
    expect((p!.state as { guesses: unknown[] }).guesses).toHaveLength(6);
    expect((await sql`SELECT played FROM player_game_stats`)[0]!.played).toBe(1);
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(1);
    expect(lines().filter((l) => l.event === 'PlayFinished')).toHaveLength(1);
  });

  it('TS-32 dos primeras jugadas concurrentes sin Play', async () => {
    const challenge = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await Promise.all([post(app, player, 'REACT'), post(app, player, 'CACHE')]);
    expect(res.map((r) => r.status)).toEqual([200, 200]);
    const rows = await sql`SELECT state, challenge_id FROM plays`;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.challenge_id).toBe(challenge.id);
    expect((rows[0]!.state as { guesses: unknown[] }).guesses).toHaveLength(2);
    const lengths = (await Promise.all(res.map((r) => r.json()))).map(
      (j) => j.play.state.guesses.length as number,
    );
    expect(Math.max(...lengths)).toBe(2);
  });

  it('TS-33 acierto y 6.º intento concurrentes', async () => {
    const player = await seed(FIVE);
    const { app } = await buildDbApp(dbs);
    const res = await Promise.all([post(app, player, 'MERGE'), post(app, player, 'CACHE')]);
    expect(res.map((r) => r.status).sort()).toEqual([200, 409]);
    const ok = await res.find((r) => r.status === 200)!.json();
    expect(['won', 'lost']).toContain(ok.play.status);
    expect(ok.play.score).toBe(6);
    const [p] = await sql`SELECT state FROM plays`;
    expect((p!.state as { guesses: unknown[] }).guesses).toHaveLength(6);
    expect((await sql`SELECT played FROM player_game_stats`)[0]!.played).toBe(1);
  });

  it('TS-12 un error en el cierre hace ROLLBACK completo', async () => {
    const player = await seed([g('REACT'), g('CACHE'), g('REACT')]);
    const { app, lines } = await buildDbApp(dbs, {
      wrapTxRepos: (r) => ({
        ...r,
        progress: {
          prevActiveDays: (d) => r.progress.prevActiveDays(d),
          lockGameStats: (...a) => r.progress.lockGameStats(...a),
          lockPlayerStats: (...a) => r.progress.lockPlayerStats(...a),
          saveGameStats: (row) => r.progress.saveGameStats(row),
          savePlayerStats: async () => {
            throw new Error('boom');
          },
        },
      }),
    });
    const res = await post(app, player, 'MERGE');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: { code: 'internal_error', message: 'Error interno del servidor.' },
    });
    const [p] = await sql`SELECT * FROM plays`;
    expect(p).toMatchObject({ status: 'in_progress', result: null, finished_at: null });
    expect((p!.state as { guesses: unknown[] }).guesses).toHaveLength(3);
    expect(await sql`SELECT 1 FROM player_game_stats`).toHaveLength(0);
    expect(await sql`SELECT 1 FROM player_stats`).toHaveLength(0);
    const events = lines().map((l) => l.event);
    expect(events).not.toContain('PlayFinished');
    expect(events).not.toContain('StreaksUpdated');
    expect(lines().some((l) => l.level === 'error')).toBe(true);
  });
});
