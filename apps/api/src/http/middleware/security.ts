import { AppError } from '@nerdose/core';
import { createMiddleware } from 'hono/factory';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

export const originAndContentType = (allowedOrigin: string) =>
  createMiddleware(async (c, next) => {
    if (MUTATING.has(c.req.method)) {
      if (c.req.header('origin') !== allowedOrigin) throw new AppError('forbidden_origin');
      if (!c.req.header('content-type')?.toLowerCase().startsWith('application/json')) {
        throw new AppError('unsupported_media_type');
      }
    }
    await next();
  });
