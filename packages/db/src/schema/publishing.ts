import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { challengeStatusEnum, gameIdEnum } from './enums';

export const challenges = pgTable(
  'challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: gameIdEnum('game_id').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    number: integer('number').notNull(),
    payload: jsonb('payload').notNull(),
    status: challengeStatusEnum('status').notNull().default('draft'),
    generatorVersion: text('generator_version').notNull(),
    seed: text('seed').notNull(),
    attempt: integer('attempt').notNull(),
    verification: jsonb('verification').notNull().default({}),
    voidReason: text('void_reason'),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    alertSentAt: timestamp('alert_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_challenges_active_game_date')
      .on(t.gameId, t.date)
      .where(sql`${t.status} IN ('approved','published','voided')`),
    index('idx_challenges_game_date_status').on(t.gameId, t.date, t.status),
    index('idx_challenges_date_status').on(t.date, t.status),
    check('ck_challenges_number_positive', sql`${t.number} >= 1`),
    check(
      'ck_challenges_voided_reason',
      sql`${t.status} <> 'voided' OR (${t.voidReason} IS NOT NULL AND ${t.voidedAt} IS NOT NULL)`,
    ),
  ],
);

export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
