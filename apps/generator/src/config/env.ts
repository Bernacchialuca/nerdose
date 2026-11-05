import { fileURLToPath } from 'node:url';

import { AppError } from '@nerdose/core';
import { createEnv } from '@t3-oss/env-core';
import { config } from 'dotenv';
import { z } from 'zod';

export function loadEnv(runtimeEnv: Record<string, string | undefined> = process.env) {
  return createEnv({
    server: {
      NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
      LOG_LEVEL: z
        .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
        .default('info'),
      SERVICE_NAME: z.string().default('generator'),
      DATABASE_URL: z.url(),
    },
    runtimeEnv,
    emptyStringAsUndefined: true,
    onValidationError: (issues) => {
      const names = [...new Set(issues.map((issue) => issue.path?.join('.')).filter(Boolean))];
      throw new AppError('validation_error', `Variables de entorno inválidas: ${names.join(', ')}`);
    },
  });
}

export type GeneratorEnv = ReturnType<typeof loadEnv>;

export function loadLocalEnvFile() {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'test' || nodeEnv === 'production') return;
  config({ path: fileURLToPath(new URL('../../.env.local', import.meta.url)), quiet: true });
}
