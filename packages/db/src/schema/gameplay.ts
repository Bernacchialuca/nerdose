import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { codeLanguageEnum, gameIdEnum, playStatusEnum } from './enums';
import { players } from './identity';
import { challenges } from './publishing';

export const plays = pgTable(
  'plays',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'restrict' }),
    challengeId: uuid('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'restrict' }),
    gameId: gameIdEnum('game_id').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    state: jsonb('state').notNull(),
    status: playStatusEnum('status').notNull().default('in_progress'),
    result: jsonb('result'),
    codeLanguage: codeLanguageEnum('code_language'),
    score: integer('score'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('uq_plays_player_challenge').on(t.playerId, t.challengeId),
    index('idx_plays_player_date').on(t.playerId, t.date),
    index('idx_plays_player_game_date').on(t.playerId, t.gameId, t.date),
    index('idx_plays_challenge_status').on(t.challengeId, t.status),
    index('idx_plays_date').on(t.date),
    check(
      'ck_plays_result_when_finished',
      sql`${t.status} NOT IN ('won','lost') OR ${t.result} IS NOT NULL`,
    ),
    check('ck_plays_finished_at', sql`${t.status} = 'in_progress' OR ${t.finishedAt} IS NOT NULL`),
    check(
      'ck_plays_code_language_game',
      sql`${t.codeLanguage} IS NULL OR ${t.gameId} IN ('big-o','bug-hunt')`,
    ),
  ],
);

export const rejectedGuesses = pgTable(
  'rejected_guesses',
  {
    word: text('word').notNull(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.word, t.playerId] }),
    check('ck_rejected_guesses_word', sql`${t.word} ~ '^[A-Z]+$'`),
  ],
);

export type Play = typeof plays.$inferSelect;
export type NewPlay = typeof plays.$inferInsert;
export type RejectedGuess = typeof rejectedGuesses.$inferSelect;
export type NewRejectedGuess = typeof rejectedGuesses.$inferInsert;
