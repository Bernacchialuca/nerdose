import { AppError } from '@nerdose/core';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export function loadMigrateEnv(runtimeEnv: Record<string, string | undefined>) {
  return createEnv({
    server: {
      DATABASE_URL_OWNER: z.url(),
      DATABASE_URL_API: z.url().optional(),
      DATABASE_URL_GENERATOR: z.url().optional(),
    },
    runtimeEnv,
    emptyStringAsUndefined: true,
    onValidationError: (issues) => {
      const names = [...new Set(issues.map((issue) => issue.path?.join('.')).filter(Boolean))];
      throw new AppError('validation_error', `Variables de entorno inválidas: ${names.join(', ')}`);
    },
  });
}

export type MigrateEnv = ReturnType<typeof loadMigrateEnv>;
