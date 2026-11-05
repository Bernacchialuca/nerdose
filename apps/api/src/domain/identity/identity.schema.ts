import { CODE_LANGUAGES, LOCALES } from '@nerdose/core';
import { z } from 'zod';

export const preferencesUpdateSchema = z
  .object({
    locale: z.enum(LOCALES).optional(),
    preferred_code_language: z.enum(CODE_LANGUAGES).optional(),
  })
  .refine((b) => b.locale !== undefined || b.preferred_code_language !== undefined);

export type PreferencesUpdate = z.infer<typeof preferencesUpdateSchema>;
