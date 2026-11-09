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
