import { DATE_PRECISIONS, TIMELINE_CATEGORIES } from '@nerdose/core';
import { z } from 'zod';

export const ITEMS_COUNT = 5;
export const OPAQUE_ID_PATTERN = /^[a-z0-9]{6}$/;

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const localized = z.object({ es: z.string(), en: z.string() });
const category = z.enum(TIMELINE_CATEGORIES);
const precision = z.enum(DATE_PRECISIONS);
const order = z.array(z.string()).length(ITEMS_COUNT);

const payloadItemSchema = z.object({
  fact_id: z.string().min(1),
  opaque_id: z.string().regex(OPAQUE_ID_PATTERN),
  label: z.string().min(1),
  event_date: day,
  date_precision: precision,
  note: localized,
});

export const payloadSchema = z.object({
  date: day,
  category,
  prompt: localized,
  items: z.array(payloadItemSchema).length(ITEMS_COUNT),
  correct_order: z.array(z.string()).length(ITEMS_COUNT),
});

export const moveSchema = z
  .strictObject({ order })
  .refine((m) => new Set(m.order).size === m.order.length, {
    path: ['order'],
    message: 'order must not repeat ids',
  });

export const stateSchema = z.strictObject({ order: order.optional() });

export const publicViewSchema = z.strictObject({
  category,
  prompt: z.string(),
  items: z.array(z.strictObject({ opaque_id: z.string(), label: z.string() })).length(ITEMS_COUNT),
});

export const feedbackSchema = z.null();

export const resultSchema = z.strictObject({
  win: z.boolean(),
  score: z.number().int().min(0).max(ITEMS_COUNT),
  category,
  correct_order: z.array(z.string()),
  submitted_order: z.array(z.string()),
  items: z
    .array(
      z.strictObject({
        opaque_id: z.string(),
        label: z.string(),
        event_date: day,
        date_precision: precision,
        note: z.string(),
      }),
    )
    .length(ITEMS_COUNT),
});

export const statsSchema = z.object({
  by_category: z.partialRecord(
    category,
    z.object({ played: z.number().int().min(0), correct: z.number().int().min(0) }),
  ),
});

export type TimelinePayload = z.infer<typeof payloadSchema>;
export type TimelineItem = TimelinePayload['items'][number];
export type TimelineMove = z.infer<typeof moveSchema>;
export type TimelineState = z.infer<typeof stateSchema>;
export type TimelinePublicView = z.infer<typeof publicViewSchema>;
export type TimelineFeedback = z.infer<typeof feedbackSchema>;
export type TimelineResult = z.infer<typeof resultSchema>;
export type TimelineStats = z.infer<typeof statsSchema>;
