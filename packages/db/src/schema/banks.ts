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
  uuid,
} from 'drizzle-orm/pg-core';

import { bankItemStatusEnum, termCategoryEnum } from './enums';

export const terms = pgTable(
  'terms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    term: text('term').notNull().unique(),
    category: termCategoryEnum('category').notNull(),
    definition: jsonb('definition').notNull(),
    summary: jsonb('summary').notNull(),
    example: jsonb('example'),
    wikidataId: text('wikidata_id').notNull().unique(),
    sitelinks: integer('sitelinks').notNull(),
    status: bankItemStatusEnum('status').notNull(),
    rejectionReason: text('rejection_reason'),
    lastUsedDevdle: date('last_used_devdle', { mode: 'string' }),
    lastUsedGrep: date('last_used_grep', { mode: 'string' }),
    datasetVersion: text('dataset_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_terms_devdle_pick').on(t.status, t.category, t.lastUsedDevdle),
    index('idx_terms_grep_pick').on(t.status, t.lastUsedGrep),
    check('ck_terms_term_format', sql`${t.term} ~ '^[A-Z]{4,12}$'`),
    check(
      'ck_terms_rejection_reason',
      sql`${t.status} <> 'rejected' OR ${t.rejectionReason} IS NOT NULL`,
    ),
    check('ck_terms_definition_locales', sql`${t.definition} ? 'es' AND ${t.definition} ? 'en'`),
    check('ck_terms_summary_locales', sql`${t.summary} ? 'es' AND ${t.summary} ? 'en'`),
  ],
);

export type Term = typeof terms.$inferSelect;
export type NewTerm = typeof terms.$inferInsert;
