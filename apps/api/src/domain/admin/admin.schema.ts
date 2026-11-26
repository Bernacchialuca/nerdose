import {
  REPORT_STATUSES,
  TERM_CATEGORIES,
  TIMELINE_CATEGORIES,
  validateMetricsRange,
  type BankName,
} from '@nerdose/core';
import { z } from 'zod';

export const loginBodySchema = z.object({ password: z.string().min(1) });
export type LoginBody = z.infer<typeof loginBodySchema>;

export const reportsQuerySchema = z.object({
  status: z.enum(REPORT_STATUSES).default('open'),
});

export const reportParamSchema = z.object({ report_id: z.uuid() });

export const reportPatchSchema = z.object({ status: z.enum(['resolved', 'dismissed']) });
export type ReportPatch = z.infer<typeof reportPatchSchema>;

export const upcomingQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(14).default(14),
});

const CATEGORIES_BY_BANK: Record<BankName, readonly string[]> = {
  terms: TERM_CATEGORIES,
  timeline_facts: TIMELINE_CATEGORIES,
};

/** `category` tiene que ser de ese banco; un `q` vacío (o solo espacios) no filtra. */
export const contentItemsQuerySchema = z
  .object({
    bank: z.enum(['terms', 'timeline_facts']),
    q: z
      .string()
      .trim()
      .max(50)
      .optional()
      .transform((v) => v || undefined),
    status: z.enum(['approved', 'rejected']).optional(),
    category: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(10).max(100).default(25),
  })
  .refine((q) => q.category === undefined || CATEGORIES_BY_BANK[q.bank].includes(q.category));
export type ContentItemsQuery = z.infer<typeof contentItemsQuerySchema>;

/** `summary` de `sync_banks`: las claves extra (skipped, by_bank) se descartan. */
export const syncSummarySchema = z.object({
  dataset_version: z.string(),
  inserted: z.number().int().min(0),
  updated: z.number().int().min(0),
  unchanged: z.number().int().min(0),
  kept_rejected: z.number().int().min(0),
});

/** El rango se valida con el día de la plataforma de la api (REQ-011, decisión 5). */
export const metricsQuerySchema = (currentDay: () => string) =>
  z
    .object({ from: z.iso.date(), to: z.iso.date() })
    .refine((q) => validateMetricsRange(q.from, q.to, currentDay()) === 'ok');
