import { AppError } from '@nerdose/core';
import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Logger } from 'pino';

import { errorMessage } from '@/http/error-messages';
import type { AppEnv } from '@/http/types';

export const createErrorHandler =
  (baseLogger: Logger): ErrorHandler<AppEnv> =>
  (rawErr, c) => {
    const log = c.var.logger ?? baseLogger;
    const locale = c.var.locale ?? 'es';
    const err =
      rawErr instanceof HTTPException && rawErr.status === 400
        ? new AppError('validation_error')
        : rawErr instanceof HTTPException && rawErr.status === 401
          ? new AppError('unauthorized')
          : rawErr;
    if (err instanceof AppError) {
      log.warn({ code: err.code }, 'Application error');
      return c.json(
        { error: { code: err.code, message: errorMessage(err.code, locale) } },
        err.status as ContentfulStatusCode,
      );
    }
    log.error({ err }, 'Unexpected error');
    return c.json(
      { error: { code: 'internal_error', message: errorMessage('internal_error', locale) } },
      500,
    );
  };
