import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { createDb } from '../src/client';
import { makeChallenge, truncateAll } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));
const api = connectAs(inject('apiUrl'));
const generator = connectAs(inject('generatorUrl'));
const { db: ownerDb, sql: ownerDbSql } = createDb(inject('ownerUrl'), { max: 1 });

const insertChallenge = (
  sql: typeof generator,
  gameId: string,
  date: string,
  status = 'approved',
  number = 40,
) =>
  sql`INSERT INTO challenges (game_id, date, number, payload, status, generator_version, seed, attempt)
    VALUES (${gameId}, ${date}, ${number}, '{}', ${status}, '1', 'aa', 0) RETURNING id`;

type GameId = 'devdle' | 'grep-grid';
const seed = (
  date: string,
  status: 'draft' | 'approved' | 'published' | 'rejected' | 'voided',
  gameId: GameId = 'devdle',
) =>
  makeChallenge(ownerDb, {
    gameId,
    date,
    status,
    ...(status === 'voided' ? { voidReason: 'bad', voidedAt: new Date() } : {}),
  });

let invalidSeq = 0;
const DUP = { code: '23505', constraint_name: 'uq_challenges_active_game_date' };

beforeAll(async () => {
  await truncateAll({ sql: owner });
});

afterAll(async () => {
  await Promise.all([owner.end(), api.end(), generator.end(), ownerDbSql.end()]);
});

describe('challenges uniqueness', () => {
  it('S015-TS-14: two live challenges for (game, date) are rejected', async () => {
    await insertChallenge(generator, 'devdle', '2026-12-10', 'approved');
    await expect(
      insertChallenge(generator, 'devdle', '2026-12-10', 'published'),
    ).rejects.toMatchObject(DUP);
  });

  it('S015-TS-15: voided also occupies the date', async () => {
    await seed('2026-12-11', 'voided');
    await expect(
      insertChallenge(generator, 'devdle', '2026-12-11', 'approved'),
    ).rejects.toMatchObject(DUP);
  });

  it('S015-TS-16: draft and rejected coexist with a live challenge', async () => {
    await insertChallenge(generator, 'devdle', '2026-12-12', 'approved');
    await insertChallenge(generator, 'devdle', '2026-12-12', 'draft');
    await insertChallenge(generator, 'devdle', '2026-12-12', 'rejected');
    await insertChallenge(generator, 'devdle', '2026-12-12', 'draft');
    const [row] = await owner`SELECT count(*)::int AS n FROM challenges
      WHERE game_id = 'devdle' AND date = '2026-12-12'`;
    expect(row!.n).toBe(4);
  });

  it('S015-TS-17: same day, other game is fine', async () => {
    await insertChallenge(generator, 'devdle', '2026-12-13', 'approved');
    await expect(
      insertChallenge(generator, 'grep-grid', '2026-12-13', 'approved'),
    ).resolves.toBeDefined();
  });
});

describe('challenges transitions', () => {
  it.each([
    ['draft', 'approved', '2026-12-14'],
    ['draft', 'rejected', '2026-12-15'],
    ['approved', 'published', '2026-12-16'],
    ['approved', 'rejected', '2026-12-17'],
  ] as const)('S015-TS-18: generator %s -> %s', async (from, to, date) => {
    const c = await seed(date, from);
    const [row] =
      await generator`UPDATE challenges SET status = ${to} WHERE id = ${c.id} RETURNING status`;
    expect(row!.status).toBe(to);
  });

  it('S015-TS-18: api voids a published challenge', async () => {
    const c = await seed('2026-12-18', 'published');
    const [row] = await api`UPDATE challenges SET status = 'voided', void_reason = 'wrong_answer',
      voided_at = now() WHERE id = ${c.id} RETURNING status`;
    expect(row!.status).toBe('voided');
  });

  it.each([
    ['published', 'approved'],
    ['rejected', 'approved'],
    ['voided', 'published'],
    ['draft', 'published'],
    ['approved', 'voided'],
    ['rejected', 'draft'],
  ] as const)('S015-TS-19: invalid transition %s -> %s', async (from, to) => {
    const date = `2028-03-${String(++invalidSeq).padStart(2, '0')}`;
    const c = await seed(date, from);
    await expect(
      generator`UPDATE challenges SET status = ${to}, void_reason = 'x', voided_at = now() WHERE id = ${c.id}`,
    ).rejects.toMatchObject({
      code: 'P0001',
      message: `challenges_status_transition: invalid transition ${from} -> ${to}`,
    });
    const [row] = await owner`SELECT status FROM challenges WHERE id = ${c.id}`;
    expect(row!.status).toBe(from);
  });

  it('S015-TS-20: same status is not a transition', async () => {
    const c = await seed('2026-12-25', 'published');
    const [row] = await generator`UPDATE challenges SET status = 'published', alerted_at = now()
      WHERE id = ${c.id} RETURNING status`;
    expect(row!.status).toBe('published');
  });
});

describe('challenges payload immutability', () => {
  const IMMUTABLE = {
    code: 'P0001',
    message: 'challenges_payload_immutable: payload, seed and attempt cannot change once approved',
  };

  it.each([
    ['approved', '2026-12-26'],
    ['published', '2026-12-27'],
    ['voided', '2026-12-28'],
  ] as const)('S015-TS-21: payload is immutable in %s', async (status, date) => {
    const c = await seed(date, status);
    await expect(
      generator`UPDATE challenges SET payload = '{"word":"OTHER"}' WHERE id = ${c.id}`,
    ).rejects.toMatchObject(IMMUTABLE);
    const [row] = await owner`SELECT payload FROM challenges WHERE id = ${c.id}`;
    expect(row!.payload).toEqual({});
  });

  it('S015-TS-22: seed and attempt are immutable', async () => {
    const c = await seed('2026-12-29', 'approved');
    await expect(
      generator`UPDATE challenges SET seed = 'bb' WHERE id = ${c.id}`,
    ).rejects.toMatchObject(IMMUTABLE);
    await expect(
      generator`UPDATE challenges SET attempt = 1 WHERE id = ${c.id}`,
    ).rejects.toMatchObject(IMMUTABLE);
  });

  it('S015-TS-23: payload is editable in draft and on approval', async () => {
    const c = await seed('2026-12-30', 'draft');
    await generator`UPDATE challenges SET payload = '{"word":"KERNEL"}', seed = 'cc', attempt = 2 WHERE id = ${c.id}`;
    const [row] = await generator`UPDATE challenges SET status = 'approved',
      verification = '{"ok":true,"checks":[]}' WHERE id = ${c.id} RETURNING status`;
    expect(row!.status).toBe('approved');
  });

  it('S015-TS-24: other columns change after approval', async () => {
    const approved = await seed('2026-12-31', 'approved');
    await generator`UPDATE challenges SET verification = '{"ok":true}' WHERE id = ${approved.id}`;
    const published = await seed('2027-02-01', 'published');
    const [row] = await api`UPDATE challenges SET alerted_at = now() WHERE id = ${published.id}
      RETURNING alerted_at`;
    expect(row!.alerted_at).toBeInstanceOf(Date);
  });

  it('S015-TS-25: rejected has no payload immutability', async () => {
    const c = await seed('2027-02-02', 'rejected');
    await expect(
      generator`UPDATE challenges SET payload = '{}' WHERE id = ${c.id}`,
    ).resolves.toBeDefined();
  });
});

describe('challenges checks', () => {
  it('S015-TS-34: number < 1 is rejected', async () => {
    await expect(
      insertChallenge(generator, 'devdle', '2027-02-03', 'draft', 0),
    ).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_challenges_number_positive',
    });
  });

  it('S015-TS-35: voided requires void_reason and voided_at', async () => {
    const c = await seed('2027-02-04', 'published');
    const expected = { code: '23514', constraint_name: 'ck_challenges_voided_reason' };
    await expect(
      api`UPDATE challenges SET status = 'voided' WHERE id = ${c.id}`,
    ).rejects.toMatchObject(expected);
    await expect(
      api`UPDATE challenges SET status = 'voided', void_reason = 'x' WHERE id = ${c.id}`,
    ).rejects.toMatchObject(expected);
  });
});
