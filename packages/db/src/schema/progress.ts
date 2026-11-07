import { sql } from 'drizzle-orm';
import { check, date, index, integer, jsonb, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { gameIdEnum } from './enums';
import { players } from './identity';

export const playerGameStats = pgTable(
  'player_game_stats',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'restrict' }),
    gameId: gameIdEnum('game_id').notNull(),
    currentStreak: integer('current_streak').notNull().default(0),
    maxStreak: integer('max_streak').notNull().default(0),
    played: integer('played').notNull().default(0),
    wins: integer('wins').notNull().default(0),
    lastCompletedDate: date('last_completed_date', { mode: 'string' }),
    extra: jsonb('extra').notNull().default({}),
  },
  (t) => [
    primaryKey({ columns: [t.playerId, t.gameId] }),
    check(
      'ck_player_game_stats_non_negative',
      sql`${t.currentStreak} >= 0 AND ${t.maxStreak} >= 0 AND ${t.played} >= 0 AND ${t.wins} >= 0`,
    ),
    check('ck_player_game_stats_max_streak', sql`${t.maxStreak} >= ${t.currentStreak}`),
  ],
);

export const playerStats = pgTable(
  'player_stats',
  {
    playerId: uuid('player_id')
      .primaryKey()
      .references(() => players.id, { onDelete: 'restrict' }),
    globalStreak: integer('global_streak').notNull().default(0),
    maxGlobalStreak: integer('max_global_streak').notNull().default(0),
    lastActiveDate: date('last_active_date', { mode: 'string' }),
    totalCompleted: integer('total_completed').notNull().default(0),
  },
  (t) => [
    index('idx_player_stats_global_streak').on(t.globalStreak),
    check(
      'ck_player_stats_non_negative',
      sql`${t.globalStreak} >= 0 AND ${t.maxGlobalStreak} >= 0 AND ${t.totalCompleted} >= 0`,
    ),
    check('ck_player_stats_max_streak', sql`${t.maxGlobalStreak} >= ${t.globalStreak}`),
  ],
);

export type PlayerGameStats = typeof playerGameStats.$inferSelect;
export type NewPlayerGameStats = typeof playerGameStats.$inferInsert;
export type PlayerStats = typeof playerStats.$inferSelect;
export type NewPlayerStats = typeof playerStats.$inferInsert;
