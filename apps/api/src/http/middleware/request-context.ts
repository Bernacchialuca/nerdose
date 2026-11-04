import { createMiddleware } from 'hono/factory';
import type { Logger } from 'pino';

import type { AppEnv } from '@/http/types';

export const requestContext = (logger: Logger) =>
  createMiddleware<AppEnv>(async (c, next) => {
    c.set('logger', logger.child({ requestId: c.get('requestId') }));
    await next();
  });
