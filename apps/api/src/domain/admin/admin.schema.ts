import { REPORT_STATUSES } from '@nerdose/core';
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

/** `summary` de `sync_banks`: las claves extra (skipped, by_bank) se descartan. */
export const syncSummarySchema = z.object({
  dataset_version: z.string(),
  inserted: z.number().int().min(0),
  updated: z.number().int().min(0),
  unchanged: z.number().int().min(0),
  kept_rejected: z.number().int().min(0),
});
