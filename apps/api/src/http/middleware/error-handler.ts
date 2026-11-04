import { AppError } from '@nerdose/core';
import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Logger } from 'pino';

import { errorMessage } from '@/http/error-messages';
import type { AppEnv } from '@/http/types';

export const createErrorHandler =
  (baseLogger: Logger): ErrorHandler<AppEnv> =>
  (err, c) => {
    const log = c.var.logger ?? baseLogger;
    if (err instanceof AppError) {
      log.warn({ code: err.code }, 'Application error');
      return c.json(
        { error: { code: err.code, message: errorMessage(err.code) } },
        err.status as ContentfulStatusCode,
      );
    }
    log.error({ err }, 'Unexpected error');
    return c.json({ error: { code: 'internal_error', message: errorMessage('internal_error') } }, 500);
  };
