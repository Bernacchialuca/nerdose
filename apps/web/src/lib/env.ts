import { z } from 'zod';

const optionalString = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

const envSchema = z
  .object({
    VITE_PLAUSIBLE_DOMAIN: optionalString,
    VITE_PLAUSIBLE_SCRIPT_URL: optionalString,
  })
  .superRefine((value, ctx) => {
    if (value.VITE_PLAUSIBLE_DOMAIN === undefined) return;
    if (
      value.VITE_PLAUSIBLE_SCRIPT_URL === undefined ||
      !URL.canParse(value.VITE_PLAUSIBLE_SCRIPT_URL)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['VITE_PLAUSIBLE_SCRIPT_URL'],
        message:
          'VITE_PLAUSIBLE_SCRIPT_URL es obligatoria (y debe ser una URL) si hay VITE_PLAUSIBLE_DOMAIN',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, unknown>): Env {
  return envSchema.parse({
    VITE_PLAUSIBLE_DOMAIN: raw.VITE_PLAUSIBLE_DOMAIN,
    VITE_PLAUSIBLE_SCRIPT_URL: raw.VITE_PLAUSIBLE_SCRIPT_URL,
  });
}

export const env = parseEnv(import.meta.env);
