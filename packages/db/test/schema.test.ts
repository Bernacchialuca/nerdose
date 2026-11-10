import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CODE_LANGUAGES, GAME_IDS, LOCALES, TERM_CATEGORIES } from '@nerdose/core';
import type { CodeLanguage, GameId, TermCategory } from '@nerdose/core';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  bankItemStatusEnum,
  challengeStatusEnum,
  challenges,
  codeLanguageEnum,
  createDb,
  gameIdEnum,
  jobRunStatusEnum,
  jobRuns,
  localeEnum,
  playStatusEnum,
  playerGameStats,
  playerStats,
  players,
  plays,
  rejectedGuesses,
  termCategoryEnum,
  terms,
} from '../src/index';
import type { Challenge, JobRun, NewChallenge, NewPlayer, Play, Player, Term } from '../src/index';
import { MIGRATIONS_FOLDER } from '../src/migrations/run-migrations';

describe('players schema', () => {
  it('S006-TS-23: pgEnums use the values from @nerdose/core', () => {
    expect(localeEnum.enumValues).toEqual([...LOCALES]);
    expect(codeLanguageEnum.enumValues).toEqual([...CODE_LANGUAGES]);
    expect(localeEnum.enumName).toBe('locale');
    expect(codeLanguageEnum.enumName).toBe('code_language');
  });

  it('S006-TS-24: migration grants api only and never DELETE/TRUNCATE', () => {
    const sql = readFileSync(join(MIGRATIONS_FOLDER, '0001_players.sql'), 'utf8');
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE ON players TO nerdose_api;');
    expect(sql).not.toContain('nerdose_generator');
    expect(sql).not.toContain('DELETE');
    expect(sql).not.toContain('TRUNCATE');
  });

  it('S006-TS-28: public exports and inferred types', () => {
    expect(players).toBeDefined();
    expect(localeEnum).toBeDefined();
    expect(codeLanguageEnum).toBeDefined();
    expect(createDb).toBeDefined();
    expectTypeOf<Player['locale']>().toEqualTypeOf<'es' | 'en'>();
    expectTypeOf<Player['preferredCodeLanguage']>().toEqualTypeOf<'js' | 'go' | 'java'>();
    expectTypeOf<Player['userId']>().toEqualTypeOf<string | null>();
    expectTypeOf<NewPlayer['locale']>().toEqualTypeOf<'es' | 'en' | undefined>();
  });
});

describe('gameplay and banks schema', () => {
  it('S015-TS-59: migration SQL has the exact GRANTs and nothing out of scope', () => {
    const sql = readFileSync(join(MIGRATIONS_FOLDER, '0002_gameplay_and_banks.sql'), 'utf8');
    for (const grant of [
      'GRANT SELECT, INSERT, UPDATE ON plays, player_game_stats, player_stats, rejected_guesses TO nerdose_api;',
      'GRANT SELECT ON challenges TO nerdose_api;',
      'GRANT UPDATE (status, void_reason, voided_at, alert_sent_at) ON challenges TO nerdose_api;',
      'GRANT SELECT ON terms TO nerdose_api;',
      'GRANT UPDATE (status, rejection_reason) ON terms TO nerdose_api;',
      'GRANT SELECT ON job_runs TO nerdose_api;',
      'GRANT SELECT, INSERT, UPDATE ON challenges, terms, job_runs TO nerdose_generator;',
    ]) {
      expect(sql).toContain(grant);
    }
    // 'ON DELETE restrict' de las FK es legítimo: lo que no debe existir es un privilegio o sentencia DELETE.
    expect(sql).not.toMatch(/GRANT[^;]*\bDELETE\b/);
    expect(sql).not.toContain('DELETE FROM');
    for (const forbidden of [
      'TRUNCATE',
      'timeline_facts',
      'challenge_reports',
      'generation_requests',
      'generation_failures',
      'metrics_',
    ]) {
      expect(sql).not.toContain(forbidden);
    }
  });

  it('ADR-017: migration 0003 renames alert_sent_at to alerted_at and nothing else', () => {
    const sql = readFileSync(join(MIGRATIONS_FOLDER, '0003_rename_alerted_at.sql'), 'utf8');
    expect(sql).toContain(
      'ALTER TABLE "challenges" RENAME COLUMN "alert_sent_at" TO "alerted_at";',
    );
    expect(sql).not.toMatch(/\b(DROP|GRANT|REVOKE|CREATE)\b/);
  });

  it('S015-TS-60: game_id and term_category derive from core', () => {
    expect(gameIdEnum.enumValues).toEqual([...GAME_IDS]);
    expect(termCategoryEnum.enumValues).toEqual([...TERM_CATEGORIES]);
    expect(gameIdEnum.enumName).toBe('game_id');
    expect(termCategoryEnum.enumName).toBe('term_category');
  });

  it('S015-TS-61: literal enums', () => {
    expect(challengeStatusEnum.enumValues).toEqual([
      'draft',
      'approved',
      'published',
      'rejected',
      'voided',
    ]);
    expect(playStatusEnum.enumValues).toEqual(['in_progress', 'won', 'lost', 'voided']);
    expect(bankItemStatusEnum.enumValues).toEqual(['approved', 'rejected']);
    expect(jobRunStatusEnum.enumValues).toEqual(['running', 'success', 'failed']);
    expect([
      challengeStatusEnum.enumName,
      playStatusEnum.enumName,
      bankItemStatusEnum.enumName,
      jobRunStatusEnum.enumName,
    ]).toEqual(['challenge_status', 'play_status', 'bank_item_status', 'job_run_status']);
  });

  it('S015-TS-62: inferred types', () => {
    expectTypeOf<Challenge['gameId']>().toEqualTypeOf<GameId>();
    expectTypeOf<Challenge['status']>().toEqualTypeOf<
      'draft' | 'approved' | 'published' | 'rejected' | 'voided'
    >();
    expectTypeOf<Play['codeLanguage']>().toEqualTypeOf<CodeLanguage | null>();
    expectTypeOf<Term['category']>().toEqualTypeOf<TermCategory>();
    expectTypeOf<JobRun['finishedAt']>().toEqualTypeOf<Date | null>();
    expectTypeOf<NewChallenge['status']>().toEqualTypeOf<
      'draft' | 'approved' | 'published' | 'rejected' | 'voided' | undefined
    >();
  });

  it('S015-TS-63: public exports', () => {
    for (const x of [
      challenges,
      plays,
      rejectedGuesses,
      playerGameStats,
      playerStats,
      terms,
      jobRuns,
    ]) {
      expect(x).toBeDefined();
    }
  });
});
