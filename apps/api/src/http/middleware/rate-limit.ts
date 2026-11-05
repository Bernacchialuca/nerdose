import { AppError } from '@nerdose/core';
import type { Context } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';

import type { AppEnv } from '@/http/types';

export const limit = (opts: {
  windowMs: number;
  limit: number;
  key: (c: Context<AppEnv>) => string;
}) =>
  rateLimiter<AppEnv>({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: 'draft-6',
    keyGenerator: opts.key,
    handler: (c) => {
      c.header('Retry-After', String(Math.ceil(opts.windowMs / 1000)));
      throw new AppError('rate_limited');
    },
  });

export const clientIp = (trustHeader?: string) => (c: Context) =>
  (trustHeader && c.req.header(trustHeader)?.split(',')[0]?.trim()) || 'unknown';
