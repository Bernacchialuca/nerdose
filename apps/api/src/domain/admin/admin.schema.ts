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
