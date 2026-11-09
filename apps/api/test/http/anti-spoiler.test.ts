import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { scoreGuess } from '@nerdose/game-devdle/definition';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { CATS, PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const FORBIDDEN_VALUES = [
  'MERGE',
  PAYLOAD.term_id,
  'Combinar los cambios',
  'Combine the changes',
  'Operación de Git',
  'Git operation',
];
const FORBIDDEN_KEYS = ['word', 'category', 'definition', 'summary', 'term_id', 'payload'];

function assertNoSpoiler(raw: string) {
  for (const v of FORBIDDEN_VALUES) expect(raw).not.toContain(v);
  for (const k of FORBIDDEN_KEYS) expect(raw).not.toContain(`"${k}":`);
}

describe('TS-18 anti-spoiler de la api (Devdle)', () => {
  it('ninguna respuesta previa al cierre contiene la solución', async () => {
    const challenge = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    const fresh = await dbs.insertPlayer();
    const playing = await dbs.insertPlayer();
    await dbs.insertPlay({
      playerId: playing.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [{ guess: 'REACT', marks: scoreGuess('MERGE', 'REACT') }] },
    });
    const { app } = await buildDbApp(dbs);

    const bodies: string[] = [];
    for (const headers of <Array<Record<string, string>>>[
      {},
      { Cookie: `nd_pid=${fresh.id}` },
      { Cookie: `nd_pid=${playing.id}` },
    ]) {
      for (const lang of ['es', 'en']) {
        const res = await app.request(`/api/games/devdle/today?lang=${lang}`, { headers });
        expect(res.status).toBe(200);
        const raw = await res.text();
        expect(JSON.parse(raw).public_view).toEqual({ length: 5, possible_categories: CATS });
        bodies.push(raw);
      }
    }
    const started = await app.request('/api/games/devdle/today/start', {
      method: 'POST',
      headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${fresh.id}` },
      body: JSON.stringify({ challenge_number: 8 }),
    });
    expect(started.status).toBe(200);
    bodies.push(await started.text());

    const today = await app.request('/api/today', { headers: { Cookie: `nd_pid=${playing.id}` } });
    bodies.push(await today.text());

    for (const raw of bodies) assertNoSpoiler(raw);
  });
});

describe('TS-42 anti-spoiler de move (Devdle)', () => {
  it('ninguna respuesta de move previa al cierre contiene la solución', async () => {
    const challenge = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    const fresh = await dbs.insertPlayer();
    const playing = await dbs.insertPlayer();
    const done = await dbs.insertPlayer();
    const react = { guess: 'REACT', marks: scoreGuess('MERGE', 'REACT') };
    await dbs.insertPlay({
      playerId: playing.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [react] },
    });
    await dbs.insertPlay({
      playerId: done.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [react] },
      status: 'lost',
      score: 6,
      result: { win: false },
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const { app } = await buildDbApp(dbs);
    const move = (player: { id: string }, payload: unknown, lang = 'es') =>
      app.request(`/api/games/devdle/today/move?lang=${lang}`, {
        method: 'POST',
        headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${player.id}` },
        body: JSON.stringify(payload),
      });
    const ok = (w: string) => ({ challenge_number: 8, move: { guess: w } });

    const bodies: string[] = [];
    for (const lang of ['es', 'en']) {
      const first = await move(fresh, ok('REACT'), lang);
      expect(first.status).toBe(200);
      const raw = await first.text();
      expect(Object.keys(JSON.parse(raw).feedback).sort()).toEqual(['guess', 'marks']);
      bodies.push(raw);
      bodies.push(await (await move(playing, ok('CACHE'), lang)).text());
      bodies.push(await (await move(playing, ok('ZZZZZ'), lang)).text());
      bodies.push(await (await move(playing, ok('REACTS'), lang)).text());
      bodies.push(await (await move(playing, { challenge_number: 8, move: {} }, lang)).text());
      bodies.push(await (await move(done, ok('REACT'), lang)).text());
      bodies.push(
        await (await move(playing, { challenge_number: 7, move: { guess: 'REACT' } }, lang)).text(),
      );
    }
    for (const raw of bodies) assertNoSpoiler(raw);

    await dbs.owner
      .sql`UPDATE challenges SET status = 'voided', void_reason = 'wrong_answer', voided_at = now()`;
    const { app: voidedApp } = await buildDbApp(dbs);
    const res = await voidedApp.request('/api/games/devdle/today/move', {
      method: 'POST',
      headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${playing.id}` },
      body: JSON.stringify(ok('CACHE')),
    });
    expect(res.status).toBe(409);
    assertNoSpoiler(await res.text());
  });
});
