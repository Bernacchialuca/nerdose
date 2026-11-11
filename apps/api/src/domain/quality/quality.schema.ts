import type { Hook } from '@hono/zod-validator';
import { AppError, CODE_LANGUAGES, REPORT_REASONS } from '@nerdose/core';
import { z } from 'zod';

export const reportBodySchema = z.object({
  challenge_number: z.number().int().min(1),
  reason: z.enum(REPORT_REASONS),
  message: z.string().trim().max(1000).optional(),
  code_language: z.enum(CODE_LANGUAGES).optional(),
});

export type ReportBody = z.infer<typeof reportBodySchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const reportValidationHook: Hook<any, any, any> = (result) => {
  if (!result.success) throw new AppError('invalid_report');
};
