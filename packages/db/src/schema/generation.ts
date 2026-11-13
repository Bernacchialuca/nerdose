import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { gameIdEnum, generationRequestStatusEnum } from './enums';
import { challenges } from './publishing';

export const generationRequests = pgTable(
  'generation_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    challengeId: uuid('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'restrict' }),
    status: generationRequestStatusEnum('status').notNull().default('pending'),
    newChallengeId: uuid('new_challenge_id').references(() => challenges.id, {
      onDelete: 'restrict',
    }),
    error: text('error'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('uq_generation_requests_pending')
      .on(t.challengeId)
      .where(sql`${t.status} = 'pending'`),
    index('idx_generation_requests_status').on(t.status, t.requestedAt),
    index('idx_generation_requests_challenge').on(t.challengeId, t.requestedAt),
    check(
      'ck_generation_requests_done_new_challenge',
      sql`${t.status} <> 'done' OR ${t.newChallengeId} IS NOT NULL`,
    ),
    check(
      'ck_generation_requests_processed_at',
      sql`${t.status} = 'pending' OR ${t.processedAt} IS NOT NULL`,
    ),
  ],
);

export type GenerationRequest = typeof generationRequests.$inferSelect;
export type NewGenerationRequest = typeof generationRequests.$inferInsert;

export const generationFailures = pgTable(
  'generation_failures',
  {
    gameId: gameIdEnum('game_id').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    attempts: integer('attempts').notNull(),
    lastReason: text('last_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.gameId, t.date] }),
    check('ck_generation_failures_attempts', sql`${t.attempts} >= 1`),
  ],
);

export type GenerationFailure = typeof generationFailures.$inferSelect;
export type NewGenerationFailure = typeof generationFailures.$inferInsert;
