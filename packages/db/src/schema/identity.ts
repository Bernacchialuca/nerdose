import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { codeLanguageEnum, localeEnum } from './enums';

export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locale: localeEnum('locale').notNull().default('es'),
    preferredCodeLanguage: codeLanguageEnum('preferred_code_language').notNull().default('js'),
    userId: uuid('user_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_players_created_at').on(table.createdAt)],
);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
