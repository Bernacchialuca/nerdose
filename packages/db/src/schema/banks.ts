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

import {
  bankItemStatusEnum,
  datePrecisionEnum,
  termCategoryEnum,
  timelineCategoryEnum,
} from './enums';

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

export const timelineFacts = pgTable(
  'timeline_facts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    label: text('label').notNull(),
    category: timelineCategoryEnum('category').notNull(),
    eventDate: date('event_date', { mode: 'string' }).notNull(),
    datePrecision: datePrecisionEnum('date_precision').notNull(),
    note: jsonb('note').notNull(),
    wikidataId: text('wikidata_id').notNull().unique(),
    sitelinks: integer('sitelinks').notNull(),
    status: bankItemStatusEnum('status').notNull(),
    rejectionReason: text('rejection_reason'),
    lastUsed: date('last_used', { mode: 'string' }),
    datasetVersion: text('dataset_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_timeline_facts_pick').on(t.status, t.category, t.lastUsed),
    check(
      'ck_timeline_facts_rejection_reason',
      sql`${t.status} <> 'rejected' OR ${t.rejectionReason} IS NOT NULL`,
    ),
    check('ck_timeline_facts_note_locales', sql`${t.note} ? 'es' AND ${t.note} ? 'en'`),
  ],
);
export type TimelineFact = typeof timelineFacts.$inferSelect;
export type NewTimelineFact = typeof timelineFacts.$inferInsert;
