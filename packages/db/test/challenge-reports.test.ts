import { randomUUID } from 'node:crypto';

import { REPORT_REASONS, REPORT_STATUSES } from '@nerdose/core';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { createDb } from '../src/client';
import { makeChallenge, makePlayer, truncateAll } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));
const api = connectAs(inject('apiUrl'));
const generator = connectAs(inject('generatorUrl'));
const { db: ownerDb, sql: ownerDbSql } = createDb(inject('ownerUrl'), { max: 1 });

type Sql = typeof api;

beforeAll(async () => {
  await truncateAll({ sql: owner });
});

afterAll(async () => {
  await Promise.all([owner.end(), api.end(), generator.end(), ownerDbSql.end()]);
});

const denied = (t: string) => ({ code: '42501', message: `permission denied for table ${t}` });

const DEFAULT_CONTEXT = {
  code_language: null,
  play_status: 'won',
  play_state: { guesses: ['REDIS'] },
  user_agent: 'Mozilla/5.0',
};

let dayCounter = 0;
const uniqueDate = () => {
  dayCounter += 1;
  return `2026-12-${String(dayCounter).padStart(2, '0')}`;
};

const fixture = async () => {
  const player = await makePlayer(ownerDb);
  const challenge = await makeChallenge(ownerDb, { gameId: 'devdle', date: uniqueDate() });
  return { player, challenge };
};

type ReportOpts = {
  challengeId: string;
  playerId: string;
  reason?: string;
  message?: string | null;
  locale?: string;
  context?: unknown;
  status?: string;
};

const insertReport = (sql: Sql, o: ReportOpts) => {
  const message = o.message === undefined ? 'La definición de REDIS es incorrecta' : o.message;
  const context = o.context === undefined ? DEFAULT_CONTEXT : o.context;
  const ctx = context === null ? null : `${JSON.stringify(context)}`;
  if (o.status !== undefined) {
    return sql`INSERT INTO challenge_reports (challenge_id, player_id, reason, message, locale, context, status)
      VALUES (${o.challengeId}, ${o.playerId}, ${o.reason ?? 'wrong_answer'}, ${message}, ${o.locale ?? 'es'},
        ${ctx}::text::jsonb, ${o.status}) RETURNING *`;
  }
  return sql`INSERT INTO challenge_reports (challenge_id, player_id, reason, message, locale, context)
    VALUES (${o.challengeId}, ${o.playerId}, ${o.reason ?? 'wrong_answer'}, ${message}, ${o.locale ?? 'es'},
      ${ctx}::text::jsonb) RETURNING *`;
};

const setStatus = async (id: string, status: string) => {
  await owner`UPDATE challenge_reports SET status = ${status} WHERE id = ${id}`;
};

const enumLabels = async (name: string) => {
  const rows = await owner`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = ${name} ORDER BY e.enumsortorder`;
  return rows.map((r) => r.enumlabel);
};

const TERMINAL_MESSAGE = 'challenge_reports_status_terminal: resolved and dismissed are terminal';

describe('challenge_reports structure', () => {
  it('S030-TS-2: report_reason enum equals REPORT_REASONS', async () => {
    expect(await enumLabels('report_reason')).toEqual([
      'wrong_answer',
      'ambiguous',
      'wrong_explanation',
      'translation',
      'display_bug',
      'other',
    ]);
    expect(await enumLabels('report_reason')).toEqual([...REPORT_REASONS]);
  });

  it('S030-TS-3: report_status enum equals REPORT_STATUSES', async () => {
    expect(await enumLabels('report_status')).toEqual(['open', 'resolved', 'dismissed']);
    expect(await enumLabels('report_status')).toEqual([...REPORT_STATUSES]);
  });

  it('S030-TS-4: exact columns', async () => {
    const rows = await owner`SELECT column_name, udt_name, is_nullable, column_default
      FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'challenge_reports'
      ORDER BY ordinal_position`;
    expect(rows.map((r) => [r.column_name, r.udt_name, r.is_nullable, r.column_default])).toEqual([
      ['id', 'uuid', 'NO', 'gen_random_uuid()'],
      ['challenge_id', 'uuid', 'NO', null],
      ['player_id', 'uuid', 'NO', null],
      ['reason', 'report_reason', 'NO', null],
      ['message', 'text', 'YES', null],
      ['locale', 'locale', 'NO', null],
      ['context', 'jsonb', 'NO', null],
      ['status', 'report_status', 'NO', "'open'::report_status"],
      ['created_at', 'timestamptz', 'NO', 'now()'],
    ]);
  });

  it('S030-TS-5: primary key', async () => {
    const rows = await owner`SELECT a.attname FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'challenge_reports'::regclass AND i.indisprimary`;
    expect(rows.map((r) => r.attname)).toEqual(['id']);
  });

  it('S030-TS-6: foreign keys are ON DELETE RESTRICT', async () => {
    const rows = await owner`SELECT conname, confrelid::regclass::text AS ref, confdeltype
      FROM pg_constraint WHERE conrelid = 'challenge_reports'::regclass AND contype = 'f' ORDER BY conname`;
    expect(rows.map((r) => [r.conname, r.ref, r.confdeltype])).toEqual([
      ['challenge_reports_challenge_id_challenges_id_fk', 'challenges', 'r'],
      ['challenge_reports_player_id_players_id_fk', 'players', 'r'],
    ]);
  });

  it('S030-TS-8: exact indexes', async () => {
    const rows = await owner`SELECT indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'challenge_reports'`;
    const defs = Object.fromEntries(rows.map((r) => [r.indexname, r.indexdef as string]));
    expect(Object.keys(defs).sort()).toEqual(
      [
        'challenge_reports_pkey',
        'idx_reports_challenge_reason',
        'idx_reports_challenge_status',
        'idx_reports_status_created_at',
        'uq_reports_player_challenge',
      ].sort(),
    );
    expect(defs['uq_reports_player_challenge']).toBe(
      'CREATE UNIQUE INDEX uq_reports_player_challenge ON public.challenge_reports USING btree (player_id, challenge_id)',
    );
    expect(defs['idx_reports_challenge_status']).toBe(
      'CREATE INDEX idx_reports_challenge_status ON public.challenge_reports USING btree (challenge_id, status)',
    );
    expect(defs['idx_reports_challenge_reason']).toBe(
      'CREATE INDEX idx_reports_challenge_reason ON public.challenge_reports USING btree (challenge_id, reason)',
    );
    expect(defs['idx_reports_status_created_at']).toBe(
      'CREATE INDEX idx_reports_status_created_at ON public.challenge_reports USING btree (status, created_at)',
    );
  });

  it('S030-TS-9: message length check', async () => {
    const rows = await owner`SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
      WHERE conrelid = 'challenge_reports'::regclass AND contype = 'c'`;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.conname).toBe('ck_reports_message_length');
    expect(rows[0]!.def).toContain('message IS NULL');
    expect(rows[0]!.def).toContain('char_length(message) <= 1000');
  });

  it('S030-TS-11: terminal status trigger', async () => {
    const rows = await owner`SELECT tgname, pg_get_triggerdef(oid) AS def FROM pg_trigger
      WHERE tgrelid = 'challenge_reports'::regclass AND NOT tgisinternal`;
    expect(rows.map((r) => [r.tgname, r.def])).toEqual([
      [
        'challenge_reports_status_terminal',
        'CREATE TRIGGER challenge_reports_status_terminal BEFORE UPDATE OF status ON public.challenge_reports FOR EACH ROW EXECUTE FUNCTION challenge_reports_status_terminal()',
      ],
    ]);
  });
});

describe('challenge_reports insert and constraints', () => {
  it('S030-TS-13: api inserts and defaults apply', async () => {
    const { player, challenge } = await fixture();
    const rows = await insertReport(api, { challengeId: challenge.id, playerId: player.id });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      challenge_id: challenge.id,
      player_id: player.id,
      reason: 'wrong_answer',
      message: 'La definición de REDIS es incorrecta',
      locale: 'es',
      context: DEFAULT_CONTEXT,
      status: 'open',
    });
    expect(rows[0]!.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(rows[0]!.created_at).toBeInstanceOf(Date);
  });

  it('S030-TS-14: null message', async () => {
    const { player, challenge } = await fixture();
    const rows = await insertReport(api, {
      challengeId: challenge.id,
      playerId: player.id,
      message: null,
      reason: 'display_bug',
      locale: 'en',
    });
    expect(rows[0]).toMatchObject({ message: null, reason: 'display_bug', locale: 'en' });
  });

  it('S030-TS-15: message of 1000 characters is accepted', async () => {
    const { player, challenge } = await fixture();
    const rows = await insertReport(api, {
      challengeId: challenge.id,
      playerId: player.id,
      message: 'a'.repeat(1000),
    });
    expect(rows).toHaveLength(1);
    const [len] =
      await owner`SELECT char_length(message)::int AS n FROM challenge_reports WHERE id = ${rows[0]!.id}`;
    expect(len!.n).toBe(1000);
  });

  it('S030-TS-16: message of 1001 characters is rejected', async () => {
    const { player, challenge } = await fixture();
    await expect(
      insertReport(api, {
        challengeId: challenge.id,
        playerId: player.id,
        message: 'a'.repeat(1001),
      }),
    ).rejects.toMatchObject({ code: '23514', constraint_name: 'ck_reports_message_length' });
  });

  it('S030-TS-17: second report of the same player and challenge', async () => {
    const { player, challenge } = await fixture();
    await insertReport(api, { challengeId: challenge.id, playerId: player.id });
    await expect(
      insertReport(api, { challengeId: challenge.id, playerId: player.id, reason: 'ambiguous' }),
    ).rejects.toMatchObject({ code: '23505', constraint_name: 'uq_reports_player_challenge' });
  });

  it('S030-TS-18: ON CONFLICT DO NOTHING keeps the original', async () => {
    const { player, challenge } = await fixture();
    const first = await insertReport(api, { challengeId: challenge.id, playerId: player.id });
    expect(first).toHaveLength(1);
    const second =
      await api`INSERT INTO challenge_reports (challenge_id, player_id, reason, locale, context)
      VALUES (${challenge.id}, ${player.id}, 'ambiguous', 'es', '{}'::jsonb)
      ON CONFLICT (player_id, challenge_id) DO NOTHING RETURNING id`;
    expect(second).toHaveLength(0);
    const [row] = await api`SELECT reason FROM challenge_reports WHERE id = ${first[0]!.id}`;
    expect(row!.reason).toBe('wrong_answer');
  });

  it('S030-TS-19: another player reports the same challenge', async () => {
    const { player, challenge } = await fixture();
    const player2 = await makePlayer(ownerDb);
    await insertReport(api, { challengeId: challenge.id, playerId: player.id });
    const rows = await insertReport(api, { challengeId: challenge.id, playerId: player2.id });
    expect(rows).toHaveLength(1);
    const [count] =
      await api`SELECT count(*)::int AS n FROM challenge_reports WHERE challenge_id = ${challenge.id}`;
    expect(count!.n).toBe(2);
  });

  it('S030-TS-20: reason outside the enum', async () => {
    const { player, challenge } = await fixture();
    await expect(
      insertReport(api, { challengeId: challenge.id, playerId: player.id, reason: 'spam' }),
    ).rejects.toMatchObject({
      code: '22P02',
      message: expect.stringContaining('invalid input value for enum report_reason'),
    });
  });

  it('S030-TS-21: status outside the enum', async () => {
    const { player, challenge } = await fixture();
    await expect(
      insertReport(api, { challengeId: challenge.id, playerId: player.id, status: 'closed' }),
    ).rejects.toMatchObject({
      code: '22P02',
      message: expect.stringContaining('invalid input value for enum report_status'),
    });
  });

  it('S030-TS-22: locale outside the enum', async () => {
    const { player, challenge } = await fixture();
    await expect(
      insertReport(api, { challengeId: challenge.id, playerId: player.id, locale: 'pt' }),
    ).rejects.toMatchObject({
      code: '22P02',
      message: expect.stringContaining('invalid input value for enum locale'),
    });
  });

  it('S030-TS-23: null context', async () => {
    const { player, challenge } = await fixture();
    await expect(
      insertReport(api, { challengeId: challenge.id, playerId: player.id, context: null }),
    ).rejects.toMatchObject({ code: '23502', column_name: 'context' });
  });

  it('S030-TS-24: unknown challenge', async () => {
    const { player } = await fixture();
    await expect(
      insertReport(api, { challengeId: randomUUID(), playerId: player.id }),
    ).rejects.toMatchObject({
      code: '23503',
      constraint_name: 'challenge_reports_challenge_id_challenges_id_fk',
    });
  });

  it('S030-TS-25: unknown player', async () => {
    const { challenge } = await fixture();
    await expect(
      insertReport(api, { challengeId: challenge.id, playerId: randomUUID() }),
    ).rejects.toMatchObject({
      code: '23503',
      constraint_name: 'challenge_reports_player_id_players_id_fk',
    });
  });

  it('S030-TS-26: RESTRICT when deleting the challenge', async () => {
    const { player, challenge } = await fixture();
    await insertReport(owner, { challengeId: challenge.id, playerId: player.id });
    await expect(owner`DELETE FROM challenges WHERE id = ${challenge.id}`).rejects.toMatchObject({
      code: '23503',
      constraint_name: 'challenge_reports_challenge_id_challenges_id_fk',
    });
    const [row] = await owner`SELECT count(*)::int AS n FROM challenges WHERE id = ${challenge.id}`;
    expect(row!.n).toBe(1);
  });

  it('S030-TS-27: RESTRICT when deleting the player', async () => {
    const { player, challenge } = await fixture();
    await insertReport(owner, { challengeId: challenge.id, playerId: player.id });
    await expect(owner`DELETE FROM players WHERE id = ${player.id}`).rejects.toMatchObject({
      code: '23503',
      constraint_name: 'challenge_reports_player_id_players_id_fk',
    });
  });
});

describe('challenge_reports terminal statuses', () => {
  const open = async () => {
    const { player, challenge } = await fixture();
    const [r] = await insertReport(api, { challengeId: challenge.id, playerId: player.id });
    return r!.id as string;
  };
  const statusOf = async (id: string) => {
    const [row] = await owner`SELECT status FROM challenge_reports WHERE id = ${id}`;
    return row!.status;
  };

  it('S030-TS-28: open to resolved', async () => {
    const id = await open();
    const rows =
      await api`UPDATE challenge_reports SET status = 'resolved' WHERE id = ${id} RETURNING status`;
    expect(rows.map((r) => ({ ...r }))).toEqual([{ status: 'resolved' }]);
  });

  it('S030-TS-29: open to dismissed', async () => {
    const id = await open();
    const rows =
      await api`UPDATE challenge_reports SET status = 'dismissed' WHERE id = ${id} RETURNING status`;
    expect(rows.map((r) => ({ ...r }))).toEqual([{ status: 'dismissed' }]);
  });

  it.each([
    ['S030-TS-30', 'resolved', 'open'],
    ['S030-TS-31', 'resolved', 'dismissed'],
    ['S030-TS-32', 'dismissed', 'open'],
    ['S030-TS-33', 'dismissed', 'resolved'],
  ])('%s: %s to %s is rejected', async (_id, from, to) => {
    const id = await open();
    await setStatus(id, from);
    await expect(
      api`UPDATE challenge_reports SET status = ${to} WHERE id = ${id}`,
    ).rejects.toMatchObject({ code: 'P0001', message: TERMINAL_MESSAGE });
    expect(await statusOf(id)).toBe(from);
  });

  it('S030-TS-34: same terminal status is not a change', async () => {
    const id = await open();
    await setStatus(id, 'resolved');
    const rows =
      await api`UPDATE challenge_reports SET status = 'resolved' WHERE id = ${id} RETURNING status`;
    expect(rows.map((r) => ({ ...r }))).toEqual([{ status: 'resolved' }]);
  });

  it('S030-TS-35: UPDATE without status on a terminal report', async () => {
    const id = await open();
    await setStatus(id, 'dismissed');
    const rows =
      await api`UPDATE challenge_reports SET message = 'corregido' WHERE id = ${id} RETURNING message, status`;
    expect(rows.map((r) => ({ ...r }))).toEqual([{ message: 'corregido', status: 'dismissed' }]);
  });

  it('S030-TS-36: bulk resolve on void only touches open reports', async () => {
    const challenge = await makeChallenge(ownerDb, { gameId: 'devdle', date: uniqueDate() });
    const players = await Promise.all([
      makePlayer(ownerDb),
      makePlayer(ownerDb),
      makePlayer(ownerDb),
    ]);
    const ids: string[] = [];
    for (const p of players) {
      const [r] = await insertReport(api, { challengeId: challenge.id, playerId: p.id });
      ids.push(r!.id);
    }
    await setStatus(ids[1]!, 'resolved');
    await setStatus(ids[2]!, 'dismissed');
    const updated = await api`UPDATE challenge_reports SET status = 'resolved'
      WHERE challenge_id = ${challenge.id} AND status = 'open' RETURNING id`;
    expect(updated.map((r) => r.id)).toEqual([ids[0]]);
    expect(await Promise.all(ids.map(statusOf))).toEqual(['resolved', 'resolved', 'dismissed']);
  });
});

describe('challenge_reports permissions', () => {
  it('S030-TS-38: api cannot DELETE or TRUNCATE', async () => {
    await expect(api`DELETE FROM challenge_reports`).rejects.toMatchObject(
      denied('challenge_reports'),
    );
    await expect(api`TRUNCATE challenge_reports`).rejects.toMatchObject(
      denied('challenge_reports'),
    );
  });

  it('S030-TS-39: generator has no access', async () => {
    const { player, challenge } = await fixture();
    await expect(generator`SELECT 1 FROM challenge_reports`).rejects.toMatchObject(
      denied('challenge_reports'),
    );
    await expect(
      insertReport(generator, { challengeId: challenge.id, playerId: player.id }),
    ).rejects.toMatchObject(denied('challenge_reports'));
    await expect(generator`UPDATE challenge_reports SET status = 'resolved'`).rejects.toMatchObject(
      denied('challenge_reports'),
    );
  });

  it('S030-TS-40: api cannot alter the table', async () => {
    await expect(api`ALTER TABLE challenge_reports ADD COLUMN x int`).rejects.toMatchObject({
      code: '42501',
      message: 'must be owner of table challenge_reports',
    });
  });

  it('S030-TS-41: api counts distinct players for the threshold', async () => {
    const challenge = await makeChallenge(ownerDb, { gameId: 'devdle', date: uniqueDate() });
    for (const reason of ['wrong_answer', 'ambiguous', 'translation']) {
      const p = await makePlayer(ownerDb);
      await insertReport(api, { challengeId: challenge.id, playerId: p.id, reason });
    }
    const [row] = await api`SELECT count(DISTINCT player_id)::int AS n FROM challenge_reports
      WHERE challenge_id = ${challenge.id} AND reason IN ('wrong_answer','ambiguous')`;
    expect(row!.n).toBe(2);
  });
});
