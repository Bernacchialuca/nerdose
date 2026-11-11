import { sql } from 'drizzle-orm';
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { localeEnum, reportReasonEnum, reportStatusEnum } from './enums';
import { players } from './identity';
import { challenges } from './publishing';

export const challengeReports = pgTable(
  'challenge_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    challengeId: uuid('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'restrict' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'restrict' }),
    reason: reportReasonEnum('reason').notNull(),
    message: text('message'),
    locale: localeEnum('locale').notNull(),
    context: jsonb('context').notNull(),
    status: reportStatusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_reports_player_challenge').on(t.playerId, t.challengeId),
    index('idx_reports_challenge_status').on(t.challengeId, t.status),
    index('idx_reports_challenge_reason').on(t.challengeId, t.reason),
    index('idx_reports_status_created_at').on(t.status, t.createdAt),
    check(
      'ck_reports_message_length',
      sql`${t.message} IS NULL OR char_length(${t.message}) <= 1000`,
    ),
  ],
);

export type ChallengeReport = typeof challengeReports.$inferSelect;
export type NewChallengeReport = typeof challengeReports.$inferInsert;
