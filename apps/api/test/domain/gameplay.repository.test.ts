import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { GameplayRepository, moveTransaction } from '@/domain/gameplay/gameplay.repository';

import { PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(() => dbs.reset());
afterAll(() => dbs.close());

const repo = () => new GameplayRepository(dbs.api.db);
const count = async (table: string) =>
  Number((await dbs.owner.sql`SELECT count(*)::int AS n FROM ${dbs.owner.sql(table)}`)[0]!.n);

async function seed(status: 'in_progress' = 'in_progress') {
  const player = await dbs.insertPlayer();
  const challenge = await dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    payload: PAYLOAD,
  });
  const play = await dbs.insertPlay({
    playerId: player.id,
    challengeId: challenge.id,
    gameId: 'devdle',
    date: '2026-12-01',
    state: { guesses: [] },
    status,
  });
  return { player, challenge, play };
}

describe('GameplayRepository (escrituras)', () => {
  it('lockPlay devuelve null sin fila y la fila si existe', async () => {
    const { player, challenge, play } = await seed();
    expect(await repo().lockPlay(player.id, randomUUID())).toBeNull();
    await dbs.api.db.transaction(async (tx) => {
      const row = await new GameplayRepository(tx).lockPlay(player.id, challenge.id);
      expect(row?.id).toBe(play.id);
    });
  });

  it('TS-46 lockPlay bloquea la fila hasta que la primera transacción termina', async () => {
    const { player, challenge } = await seed();
    const order: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let locked!: () => void;
    const hasLock = new Promise<void>((r) => (locked = r));

    const tx1 = dbs.api.db.transaction(async (tx) => {
      await new GameplayRepository(tx).lockPlay(player.id, challenge.id);
      locked();
      await gate;
      order.push('tx1-end');
    });
    await hasLock;
    const tx2 = dbs.api.db.transaction(async (tx) => {
      await new GameplayRepository(tx).lockPlay(player.id, challenge.id);
      order.push('tx2-locked');
    });
    // tx2 no puede resolver mientras tx1 retiene el lock: lo liberamos cuando tx2 ya está en espera.
    const waiting = (async () => {
      for (;;) {
        const rows = await dbs.owner.sql`SELECT 1 FROM pg_locks WHERE NOT granted`;
        if (rows.length > 0) return;
        await new Promise((r) => setImmediate(r));
      }
    })();
    await waiting;
    expect(order).toEqual([]);
    release();
    await Promise.all([tx1, tx2]);
    expect(order).toEqual(['tx1-end', 'tx2-locked']);
  });

  it('updateState persiste el estado', async () => {
    const { play } = await seed();
    const updated = await repo().updateState(play.id, { guesses: [{ guess: 'REACT' }] });
    expect(updated.state).toEqual({ guesses: [{ guess: 'REACT' }] });
    const [row] = await dbs.owner.sql`SELECT state FROM plays WHERE id = ${play.id}`;
    expect(row!.state).toEqual({ guesses: [{ guess: 'REACT' }] });
  });

  it('closePlay cierra en una sola sentencia y cumple los checks', async () => {
    const { play } = await seed();
    const finishedAt = new Date('2026-12-01T10:00:00Z');
    const closed = await repo().closePlay(play.id, {
      state: { guesses: [1] },
      status: 'won',
      result: { win: true },
      score: 4,
      finishedAt,
      codeLanguage: null,
    });
    expect(closed).toMatchObject({
      status: 'won',
      score: 4,
      result: { win: true },
      state: { guesses: [1] },
      codeLanguage: null,
    });
    expect(closed.finishedAt).toEqual(finishedAt);
  });

  it('insertRejectedGuess dos veces deja una sola fila', async () => {
    const player = await dbs.insertPlayer();
    await repo().insertRejectedGuess('ZZZZZ', player.id);
    await repo().insertRejectedGuess('ZZZZZ', player.id);
    expect(await count('rejected_guesses')).toBe(1);
  });

  it('moveTransaction: si fn lanza no queda nada escrito', async () => {
    const { player, challenge } = await seed();
    const other = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-02',
      number: 9,
      payload: PAYLOAD,
    });
    await expect(
      moveTransaction(dbs.api.db)(async ({ plays }) => {
        await plays.insertPlayIfAbsent({
          playerId: player.id,
          challengeId: other.id,
          gameId: 'devdle',
          date: '2026-12-02',
          state: {},
        });
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(await count('plays')).toBe(1);
    expect(challenge.id).not.toBe(other.id);
  });
});

describe('GameplayRepository.closePlay con codeLanguage', () => {
  const finishedAt = new Date('2026-12-01T10:00:00Z');

  it('TS-10 persiste codeLanguage en una Play big-o (S-042 TS-10)', async () => {
    const player = await dbs.insertPlayer();
    const challenge = await dbs.insertChallenge({
      gameId: 'big-o',
      date: '2026-12-01',
      number: 8,
      payload: { answer: 'o_n' },
    });
    const play = await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'big-o',
      date: '2026-12-01',
      state: {},
    });
    const row = await repo().closePlay(play.id, {
      state: { language: 'go', option: 'o_n' },
      status: 'won',
      result: { win: true, score: 1 },
      score: 1,
      finishedAt,
      codeLanguage: 'go',
    });
    expect(row).toMatchObject({ codeLanguage: 'go', status: 'won', score: 1 });
    const [db] = await dbs.owner.sql`SELECT code_language FROM plays WHERE id = ${play.id}`;
    expect(db!.code_language).toBe('go');
  });

  it('TS-11 codeLanguage null deja code_language en NULL (S-042 TS-11)', async () => {
    const { play } = await seed();
    const row = await repo().closePlay(play.id, {
      state: { guesses: [] },
      status: 'won',
      result: { win: true, score: 1 },
      score: 1,
      finishedAt,
      codeLanguage: null,
    });
    expect(row.codeLanguage).toBeNull();
    const [db] = await dbs.owner.sql`SELECT code_language FROM plays WHERE id = ${play.id}`;
    expect(db!.code_language).toBeNull();
  });

  it('TS-12 moveTransaction expone identity y revierte si fn lanza (S-042 TS-12)', async () => {
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'js' });
    const pref = async () =>
      (
        await dbs.owner
          .sql`SELECT preferred_code_language AS p FROM players WHERE id = ${player.id}`
      )[0]!.p;
    await expect(
      moveTransaction(dbs.api.db)(async ({ identity }) => {
        await identity.updatePreferences(player.id, { preferredCodeLanguage: 'go' });
        throw new Error('x');
      }),
    ).rejects.toThrow('x');
    expect(await pref()).toBe('js');
    await moveTransaction(dbs.api.db)(async ({ identity }) => {
      await identity.updatePreferences(player.id, { preferredCodeLanguage: 'go' });
    });
    expect(await pref()).toBe('go');
  });
});
