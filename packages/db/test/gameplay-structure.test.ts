import { GAME_IDS, TERM_CATEGORIES } from '@nerdose/core';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { truncateAll } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));

beforeAll(async () => {
  await truncateAll({ sql: owner });
});

afterAll(async () => {
  await owner.end();
});

const enumLabels = async (name: string) => {
  const rows = await owner`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = ${name} ORDER BY e.enumsortorder`;
  return rows.map((r) => r.enumlabel);
};

const columns = async (table: string) => {
  const rows = await owner`SELECT column_name, udt_name, is_nullable, column_default
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${table}
    ORDER BY ordinal_position`;
  return rows.map((r) => [r.column_name, r.udt_name, r.is_nullable, r.column_default]);
};

describe('gameplay and banks structure', () => {
  it('S015-TS-1: 0002_gameplay_and_banks is registered', async () => {
    const [row] = await owner`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`;
    expect(row!.n).toBe(3);
  });

  it('S015-TS-2: game_id enum equals GAME_IDS', async () => {
    expect(await enumLabels('game_id')).toEqual([...GAME_IDS]);
  });

  it('S015-TS-3: term_category enum equals TERM_CATEGORIES', async () => {
    expect(await enumLabels('term_category')).toEqual([...TERM_CATEGORIES]);
  });

  it.each([
    ['challenge_status', ['draft', 'approved', 'published', 'rejected', 'voided']],
    ['play_status', ['in_progress', 'won', 'lost', 'voided']],
    ['bank_item_status', ['approved', 'rejected']],
    ['job_run_status', ['running', 'success', 'failed']],
  ])('S015-TS-4: enum %s has exact values', async (name, expected) => {
    expect(await enumLabels(name)).toEqual(expected);
  });

  it('S015-TS-5: challenges columns', async () => {
    expect(await columns('challenges')).toEqual([
      ['id', 'uuid', 'NO', 'gen_random_uuid()'],
      ['game_id', 'game_id', 'NO', null],
      ['date', 'date', 'NO', null],
      ['number', 'int4', 'NO', null],
      ['payload', 'jsonb', 'NO', null],
      ['status', 'challenge_status', 'NO', "'draft'::challenge_status"],
      ['generator_version', 'text', 'NO', null],
      ['seed', 'text', 'NO', null],
      ['attempt', 'int4', 'NO', null],
      ['verification', 'jsonb', 'NO', "'{}'::jsonb"],
      ['void_reason', 'text', 'YES', null],
      ['voided_at', 'timestamptz', 'YES', null],
      ['alert_sent_at', 'timestamptz', 'YES', null],
      ['created_at', 'timestamptz', 'NO', 'now()'],
    ]);
  });

  it('S015-TS-6: plays columns', async () => {
    expect(await columns('plays')).toEqual([
      ['id', 'uuid', 'NO', 'gen_random_uuid()'],
      ['player_id', 'uuid', 'NO', null],
      ['challenge_id', 'uuid', 'NO', null],
      ['game_id', 'game_id', 'NO', null],
      ['date', 'date', 'NO', null],
      ['state', 'jsonb', 'NO', null],
      ['status', 'play_status', 'NO', "'in_progress'::play_status"],
      ['result', 'jsonb', 'YES', null],
      ['code_language', 'code_language', 'YES', null],
      ['score', 'int4', 'YES', null],
      ['started_at', 'timestamptz', 'NO', 'now()'],
      ['finished_at', 'timestamptz', 'YES', null],
    ]);
  });

  it('S015-TS-7: rejected_guesses, player_game_stats and player_stats columns', async () => {
    expect(await columns('rejected_guesses')).toEqual([
      ['word', 'text', 'NO', null],
      ['player_id', 'uuid', 'NO', null],
      ['created_at', 'timestamptz', 'NO', 'now()'],
    ]);
    expect(await columns('player_game_stats')).toEqual([
      ['player_id', 'uuid', 'NO', null],
      ['game_id', 'game_id', 'NO', null],
      ['current_streak', 'int4', 'NO', '0'],
      ['max_streak', 'int4', 'NO', '0'],
      ['played', 'int4', 'NO', '0'],
      ['wins', 'int4', 'NO', '0'],
      ['last_completed_date', 'date', 'YES', null],
      ['extra', 'jsonb', 'NO', "'{}'::jsonb"],
    ]);
    expect(await columns('player_stats')).toEqual([
      ['player_id', 'uuid', 'NO', null],
      ['global_streak', 'int4', 'NO', '0'],
      ['max_global_streak', 'int4', 'NO', '0'],
      ['last_active_date', 'date', 'YES', null],
      ['total_completed', 'int4', 'NO', '0'],
    ]);
  });

  it('S015-TS-8: terms and job_runs columns', async () => {
    expect(await columns('terms')).toEqual([
      ['id', 'uuid', 'NO', 'gen_random_uuid()'],
      ['term', 'text', 'NO', null],
      ['category', 'term_category', 'NO', null],
      ['definition', 'jsonb', 'NO', null],
      ['summary', 'jsonb', 'NO', null],
      ['example', 'jsonb', 'YES', null],
      ['wikidata_id', 'text', 'NO', null],
      ['sitelinks', 'int4', 'NO', null],
      ['status', 'bank_item_status', 'NO', null],
      ['rejection_reason', 'text', 'YES', null],
      ['last_used_devdle', 'date', 'YES', null],
      ['last_used_grep', 'date', 'YES', null],
      ['dataset_version', 'text', 'NO', null],
      ['created_at', 'timestamptz', 'NO', 'now()'],
      ['updated_at', 'timestamptz', 'NO', 'now()'],
    ]);
    expect(await columns('job_runs')).toEqual([
      ['id', 'uuid', 'NO', 'gen_random_uuid()'],
      ['job', 'text', 'NO', null],
      ['status', 'job_run_status', 'NO', "'running'::job_run_status"],
      ['started_at', 'timestamptz', 'NO', 'now()'],
      ['finished_at', 'timestamptz', 'YES', null],
      ['summary', 'jsonb', 'NO', "'{}'::jsonb"],
    ]);
  });

  it.each([
    ['challenges', ['id']],
    ['plays', ['id']],
    ['terms', ['id']],
    ['job_runs', ['id']],
    ['rejected_guesses', ['player_id', 'word']],
    ['player_game_stats', ['game_id', 'player_id']],
    ['player_stats', ['player_id']],
  ])('S015-TS-9: primary key of %s', async (table, expected) => {
    const rows = await owner`SELECT a.attname FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ${table}::regclass AND i.indisprimary`;
    expect(rows.map((r) => r.attname).sort()).toEqual(expected);
  });

  it('S015-TS-10: indexes have the exact definition', async () => {
    const rows =
      await owner`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'`;
    const defs = Object.fromEntries(rows.map((r) => [r.indexname, r.indexdef as string]));
    expect(defs['uq_challenges_active_game_date']).toBe(
      "CREATE UNIQUE INDEX uq_challenges_active_game_date ON public.challenges USING btree (game_id, date) WHERE (status = ANY (ARRAY['approved'::challenge_status, 'published'::challenge_status, 'voided'::challenge_status]))",
    );
    const tail: Record<string, string> = {
      idx_challenges_game_date_status: 'ON public.challenges USING btree (game_id, date, status)',
      idx_challenges_date_status: 'ON public.challenges USING btree (date, status)',
      uq_plays_player_challenge: 'ON public.plays USING btree (player_id, challenge_id)',
      idx_plays_player_date: 'ON public.plays USING btree (player_id, date)',
      idx_plays_player_game_date: 'ON public.plays USING btree (player_id, game_id, date)',
      idx_plays_challenge_status: 'ON public.plays USING btree (challenge_id, status)',
      idx_plays_date: 'ON public.plays USING btree (date)',
      idx_player_stats_global_streak: 'ON public.player_stats USING btree (global_streak)',
      idx_terms_devdle_pick: 'ON public.terms USING btree (status, category, last_used_devdle)',
      idx_terms_grep_pick: 'ON public.terms USING btree (status, last_used_grep)',
      idx_job_runs_job_started_at: 'ON public.job_runs USING btree (job, started_at)',
    };
    for (const [name, suffix] of Object.entries(tail)) {
      const unique = name.startsWith('uq_') ? 'UNIQUE ' : '';
      expect(defs[name]).toBe(`CREATE ${unique}INDEX ${name} ${suffix}`);
    }
  });

  it('S015-TS-11: foreign keys are ON DELETE RESTRICT', async () => {
    const rows = await owner`SELECT conrelid::regclass::text AS t, confrelid::regclass::text AS ref,
      confdeltype FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace
      ORDER BY 1, 2`;
    expect(rows.map((r) => [r.t, r.ref, r.confdeltype])).toEqual(
      [
        ['plays', 'challenges', 'r'],
        ['plays', 'players', 'r'],
        ['player_game_stats', 'players', 'r'],
        ['player_stats', 'players', 'r'],
        ['rejected_guesses', 'players', 'r'],
      ].sort((a, b) => (a[0]! + a[1]!).localeCompare(b[0]! + b[1]!)),
    );
  });

  it('S015-TS-12: exactly the 14 check constraints', async () => {
    const rows = await owner`SELECT conname FROM pg_constraint
      WHERE contype = 'c' AND connamespace = 'public'::regnamespace ORDER BY conname`;
    expect(rows.map((r) => r.conname)).toEqual(
      [
        'ck_challenges_number_positive',
        'ck_challenges_voided_reason',
        'ck_plays_result_when_finished',
        'ck_plays_finished_at',
        'ck_plays_code_language_game',
        'ck_rejected_guesses_word',
        'ck_player_game_stats_non_negative',
        'ck_player_game_stats_max_streak',
        'ck_player_stats_non_negative',
        'ck_player_stats_max_streak',
        'ck_terms_term_format',
        'ck_terms_rejection_reason',
        'ck_terms_definition_locales',
        'ck_terms_summary_locales',
      ].sort(),
    );
  });

  it('S015-TS-13: triggers', async () => {
    const rows = await owner`SELECT tgname, tgrelid::regclass::text AS t FROM pg_trigger
      WHERE NOT tgisinternal ORDER BY tgname`;
    expect(rows.map((r) => [r.tgname, r.t])).toEqual([
      ['bank_items_rejected_terminal', 'terms'],
      ['challenges_payload_immutable', 'challenges'],
      ['challenges_status_transition', 'challenges'],
      ['set_updated_at', 'terms'],
    ]);
  });
});
