import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { scoreGuess } from '@nerdose/game-devdle/definition';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { CODE_PAYLOAD, codeNullRegistry, codeRegistry } from '../helpers/code-game';
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

const sql = dbs.owner.sql;
const err = (code: string) => ({ error: { code, message: expect.any(String) } });
const bigO = (language: string, option: string) => ({
  challenge_number: 8,
  move: { language, option },
});

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };
const post = (app: App, game: string, payload: unknown, player: { id: string }) =>
  app.request(`/api/games/${game}/today/move`, {
    method: 'POST',
    headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${player.id}` },
    body: JSON.stringify(payload),
  });

const publishBigO = () =>
  dbs.insertChallenge({
    gameId: 'big-o',
    date: '2026-12-01',
    number: 8,
    status: 'published',
    payload: CODE_PAYLOAD,
  });
const publishDevdle = () =>
  dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    status: 'published',
    payload: PAYLOAD,
  });
const pref = async (id: string) =>
  (await sql`SELECT preferred_code_language AS p FROM players WHERE id = ${id}`)[0]!.p;
const playsOf = (id: string) =>
  sql`SELECT code_language, status, finished_at FROM plays WHERE player_id = ${id}`;

describe('POST /api/games/:game/today/move con lenguaje de código', () => {
  it('TS-1 cierra won en go y guarda lenguaje y preferencia (S-042 TS-1)', async () => {
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'js' });
    await publishBigO();
    const { app } = await buildDbApp(dbs, { games: codeRegistry });
    const res = await post(app, 'big-o', bigO('go', 'o_n_log_n'), player);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play).toEqual({
      status: 'won',
      state: { language: 'go', option: 'o_n_log_n' },
      score: 1,
      code_language: 'go',
    });
    expect(json.result).toEqual({
      win: true,
      score: 1,
      option: 'o_n_log_n',
      answer: 'o_n_log_n',
    });
    expect(json.streaks).not.toBeNull();
    expect(json.game_stats).not.toBeNull();
    expect(json.feedback).toBeNull();
    const [row] = await playsOf(player.id);
    expect(row).toMatchObject({ status: 'won', code_language: 'go' });
    expect(row!.finished_at).not.toBeNull();
    expect(await pref(player.id)).toBe('go');
    const stats =
      await sql`SELECT played, wins FROM player_game_stats WHERE player_id = ${player.id} AND game_id = 'big-o'`;
    expect(stats).toHaveLength(1);
    expect(stats[0]).toMatchObject({ played: 1, wins: 1 });
  });

  it('TS-2 cierra lost en java y también guarda lenguaje y preferencia (S-042 TS-2)', async () => {
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'go' });
    await publishBigO();
    const { app } = await buildDbApp(dbs, { games: codeRegistry });
    const res = await post(app, 'big-o', bigO('java', 'o_n2'), player);
    expect(res.status).toBe(200);
    expect((await res.json()).play).toEqual({
      status: 'lost',
      state: { language: 'java', option: 'o_n2' },
      score: 0,
      code_language: 'java',
    });
    expect((await playsOf(player.id))[0]).toMatchObject({ status: 'lost', code_language: 'java' });
    expect(await pref(player.id)).toBe('java');
  });

  it('TS-3 GET today devuelve el code_language persistido (S-042 TS-3)', async () => {
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'js' });
    await publishBigO();
    const { app } = await buildDbApp(dbs, { games: codeRegistry });
    await post(app, 'big-o', bigO('go', 'o_n_log_n'), player);
    const res = await app.request('/api/games/big-o/today', {
      headers: { Cookie: `nd_pid=${player.id}` },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).play).toMatchObject({ status: 'won', code_language: 'go' });
  });

  it('TS-4 codeLanguage null: cierra sin tocar la preferencia (S-042 TS-4)', async () => {
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'java' });
    await publishBigO();
    const { app } = await buildDbApp(dbs, { games: codeNullRegistry });
    const res = await post(app, 'big-o', bigO('go', 'o_n_log_n'), player);
    expect(res.status).toBe(200);
    expect((await res.json()).play).toMatchObject({ status: 'won', code_language: null });
    expect((await playsOf(player.id))[0]).toMatchObject({ status: 'won', code_language: null });
    expect(await pref(player.id)).toBe('java');
  });

  it('TS-5 Devdle cierra con code_language null y preferencia intacta (S-042 TS-5)', async () => {
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'go' });
    await publishDevdle();
    const { app } = await buildDbApp(dbs);
    const res = await post(
      app,
      'devdle',
      { challenge_number: 8, move: { guess: 'MERGE' } },
      player,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play).toMatchObject({ status: 'won', score: 1, code_language: null });
    expect((await playsOf(player.id))[0]).toMatchObject({ code_language: null });
    expect(await pref(player.id)).toBe('go');
  });

  it('TS-6 jugada que no cierra: code_language null y preferencia sin cambios (S-042 TS-6)', async () => {
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'java' });
    await publishDevdle();
    const { app } = await buildDbApp(dbs);
    const res = await post(
      app,
      'devdle',
      { challenge_number: 8, move: { guess: 'REACT' } },
      player,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play).toEqual({
      status: 'in_progress',
      state: { guesses: [{ guess: 'REACT', marks: scoreGuess('MERGE', 'REACT') }] },
      score: null,
      code_language: null,
    });
    expect(json).toMatchObject({ result: null, streaks: null, game_stats: null });
    expect((await playsOf(player.id))[0]).toMatchObject({ code_language: null });
    expect(await pref(player.id)).toBe('java');
  });

  it('TS-7 falla en updatePreferences: 500 y ROLLBACK completo (S-042 TS-7)', async () => {
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'js' });
    await publishBigO();
    const { app, lines } = await buildDbApp(dbs, {
      games: codeRegistry,
      wrapTxRepos: (r) => ({
        ...r,
        identity: {
          updatePreferences: async () => {
            throw new Error('boom');
          },
        },
      }),
    });
    const res = await post(app, 'big-o', bigO('go', 'o_n_log_n'), player);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual(err('internal_error'));
    expect((await playsOf(player.id)).filter((p) => p.status === 'won')).toHaveLength(0);
    expect(await sql`SELECT 1 FROM player_game_stats WHERE player_id = ${player.id}`).toHaveLength(
      0,
    );
    expect(await sql`SELECT 1 FROM player_stats WHERE player_id = ${player.id}`).toHaveLength(0);
    expect(await pref(player.id)).toBe('js');
    expect(JSON.stringify(lines())).not.toContain('PlayFinished');
  });

  it('TS-8 segunda jugada sobre la Play cerrada: 409 y nada cambia (S-042 TS-8)', async () => {
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'js' });
    await publishBigO();
    const { app } = await buildDbApp(dbs, { games: codeRegistry });
    await post(app, 'big-o', bigO('go', 'o_n_log_n'), player);
    const res = await post(app, 'big-o', bigO('java', 'o_1'), player);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('game_finished'));
    expect((await playsOf(player.id))[0]).toMatchObject({ code_language: 'go' });
    expect(await pref(player.id)).toBe('go');
  });

  it('TS-9 move inválido: 422 sin Play ni cambio de preferencia (S-042 TS-9)', async () => {
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'js' });
    await publishBigO();
    const { app } = await buildDbApp(dbs, { games: codeRegistry });
    const res = await post(app, 'big-o', bigO('rust', 'o_n'), player);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(err('invalid_move'));
    expect(await playsOf(player.id)).toHaveLength(0);
    expect(await pref(player.id)).toBe('js');
  });
});

describe('sin ramificación por juego en src', () => {
  it('TS-17 los literales big-o y bug-hunt no aparecen en apps/api/src (S-042 TS-17)', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.ts')) files.push(full);
      }
    };
    walk(join(__dirname, '../../src'));
    const offenders = files.filter((f) => /'(big-o|bug-hunt)'/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
