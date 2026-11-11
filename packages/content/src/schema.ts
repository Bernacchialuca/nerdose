import {
  DATE_PRECISIONS,
  TERM_CATEGORIES,
  TIMELINE_CATEGORIES,
  type DatePrecision,
  type TimelineCategory,
} from '@nerdose/core';
import { z } from 'zod';

export const REJECTION_REASONS = [
  'invalid_chars',
  'invalid_length',
  'missing_translation',
  'missing_article',
  'low_sitelinks',
  'excluded',
  'duplicate',
] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

export { DATE_PRECISIONS, TIMELINE_CATEGORIES };
export type { DatePrecision, TimelineCategory };

export const TIMELINE_REJECTION_REASONS = [
  'disputed_date',
  'imprecise_date',
  'missing_article',
  'low_sitelinks',
  'missing_note',
  'note_year_mismatch',
  'excluded',
  'duplicate',
] as const;
export type TimelineRejectionReason = (typeof TIMELINE_REJECTION_REASONS)[number];

const WIKIDATA_ID = /^Q[1-9]\d*$/;
const TERM_FORMAT = /^[A-Z]{4,12}$/;
const DATASET_VERSION = /^\d{4}\.\d{2}\.\d{2}(-\d+)?$/;

const localizedSchema = z.strictObject({ es: z.string(), en: z.string() });
const wikidataIdSchema = z.string().regex(WIKIDATA_ID);
const sitelinksSchema = z.number().int().min(0);
const statusSchema = z.enum(['approved', 'rejected']);
const filledText = (text: string): boolean => text.trim().length > 0;

export const termItemSchema = z
  .strictObject({
    wikidata_id: wikidataIdSchema,
    term: z.string(),
    category: z.enum(TERM_CATEGORIES),
    definition: localizedSchema,
    summary: localizedSchema,
    sitelinks: sitelinksSchema,
    status: statusSchema,
    rejection_reason: z.enum(REJECTION_REASONS).nullable(),
  })
  .superRefine((item, ctx) => {
    if (item.status === 'rejected') {
      if (item.rejection_reason === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['rejection_reason'],
          message: 'un término rejected requiere rejection_reason',
        });
      }
      return;
    }
    if (item.rejection_reason !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['rejection_reason'],
        message: 'un término approved debe tener rejection_reason null',
      });
    }
    if (!TERM_FORMAT.test(item.term)) {
      ctx.addIssue({
        code: 'custom',
        path: ['term'],
        message: 'un término approved debe cumplir ^[A-Z]{4,12}$',
      });
    }
    const texts = {
      definition: item.definition,
      summary: item.summary,
    };
    for (const [field, value] of Object.entries(texts)) {
      for (const locale of ['es', 'en'] as const) {
        if (!filledText(value[locale])) {
          ctx.addIssue({
            code: 'custom',
            path: [field, locale],
            message: 'un término approved requiere los cuatro textos no vacíos',
          });
        }
      }
    }
  });
export type TermItem = z.infer<typeof termItemSchema>;

export const termsFileSchema = z.array(termItemSchema).superRefine((items, ctx) => {
  const ids = new Set<string>();
  const approvedTerms = new Set<string>();
  items.forEach((item, index) => {
    if (ids.has(item.wikidata_id)) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'wikidata_id'],
        message: `wikidata_id duplicado: ${item.wikidata_id}`,
      });
    }
    ids.add(item.wikidata_id);
    if (item.status === 'approved') {
      if (approvedTerms.has(item.term)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'term'],
          message: `term duplicado entre approved: ${item.term}`,
        });
      }
      approvedTerms.add(item.term);
    }
  });
});

const EVENT_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string): boolean {
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function matchesPrecision(value: string, precision: DatePrecision): boolean {
  if (precision === 'year') return value.endsWith('-01-01');
  if (precision === 'month') return value.endsWith('-01');
  return true;
}

export const timelineFactItemSchema = z
  .strictObject({
    wikidata_id: wikidataIdSchema,
    label: z.string(),
    category: z.enum(TIMELINE_CATEGORIES),
    event_date: z.string().regex(EVENT_DATE),
    date_precision: z.enum(DATE_PRECISIONS),
    note: localizedSchema,
    sitelinks: sitelinksSchema,
    status: statusSchema,
    rejection_reason: z.enum(TIMELINE_REJECTION_REASONS).nullable(),
  })
  .superRefine((item, ctx) => {
    if (item.status === 'rejected') {
      if (item.rejection_reason === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['rejection_reason'],
          message: 'un hecho rejected requiere rejection_reason',
        });
      }
      return;
    }
    if (item.rejection_reason !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['rejection_reason'],
        message: 'un hecho approved debe tener rejection_reason null',
      });
    }
    for (const locale of ['es', 'en'] as const) {
      if (!filledText(item.note[locale])) {
        ctx.addIssue({
          code: 'custom',
          path: ['note', locale],
          message: 'un hecho approved requiere la nota en es y en',
        });
      }
    }
    if (
      !isCalendarDate(item.event_date) ||
      !matchesPrecision(item.event_date, item.date_precision)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['event_date'],
        message: `un hecho approved requiere un event_date real y coherente con la precisión ${item.date_precision}`,
      });
    }
  });
export type TimelineFactItem = z.infer<typeof timelineFactItemSchema>;

export const timelineFactsFileSchema = z.array(timelineFactItemSchema).superRefine((items, ctx) => {
  const ids = new Set<string>();
  items.forEach((item, index) => {
    if (ids.has(item.wikidata_id)) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'wikidata_id'],
        message: `wikidata_id duplicado: ${item.wikidata_id}`,
      });
    }
    ids.add(item.wikidata_id);
  });
});

const count = z.number().int().min(0);

const timelineCountsSchema = z.strictObject({
  approved: count,
  rejected: count,
  by_category: z.strictObject(
    Object.fromEntries(
      TIMELINE_CATEGORIES.map((category) => [
        category,
        z.strictObject({ approved: count, rejected: count }),
      ]),
    ) as Record<
      TimelineCategory,
      z.ZodObject<{ approved: z.ZodNumber; rejected: z.ZodNumber }, z.core.$strict>
    >,
  ),
  by_reason: z.strictObject(
    Object.fromEntries(TIMELINE_REJECTION_REASONS.map((reason) => [reason, count])) as Record<
      TimelineRejectionReason,
      z.ZodNumber
    >,
  ),
});

const timelineParametersSchema = z.strictObject({
  min_sitelinks: count,
  min_approved_per_category: count,
  min_categories: count,
  categories_v1: z
    .array(z.enum(TIMELINE_CATEGORIES))
    .refine(
      (list) => new Set(list).size === list.length,
      'categories_v1 no puede repetir categorías',
    ),
  classes: z.array(
    z.strictObject({
      wikidata_class: z.string(),
      category: z.enum(TIMELINE_CATEGORIES),
      date_property: z.string().regex(/^P[1-9]\d*$/),
    }),
  ),
});

export const manifestSchema = z.strictObject({
  dataset_version: z.string().regex(DATASET_VERSION),
  generated_at: z.iso.datetime(),
  min_sitelinks: count,
  counts: z.strictObject({
    terms: z.strictObject({
      approved: count,
      rejected: count,
      by_category: z.strictObject(
        Object.fromEntries(
          TERM_CATEGORIES.map((category) => [
            category,
            z.strictObject({ approved: count, rejected: count }),
          ]),
        ) as Record<
          (typeof TERM_CATEGORIES)[number],
          z.ZodObject<{ approved: z.ZodNumber; rejected: z.ZodNumber }, z.core.$strict>
        >,
      ),
      by_reason: z.strictObject(
        Object.fromEntries(REJECTION_REASONS.map((reason) => [reason, count])) as Record<
          RejectionReason,
          z.ZodNumber
        >,
      ),
    }),
    timeline_facts: timelineCountsSchema,
  }),
  parameters: z.strictObject({
    min_sitelinks: count,
    min_approved_terms: count,
    term_length: z.strictObject({ min: count, max: count }),
    languages: z.array(z.enum(['es', 'en'])),
    classes: z.array(
      z.strictObject({ wikidata_class: z.string(), category: z.enum(TERM_CATEGORIES) }),
    ),
    timeline: timelineParametersSchema,
  }),
});
export type DatasetManifest = z.infer<typeof manifestSchema>;
