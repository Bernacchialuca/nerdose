import { createFactory } from 'hono/factory';

import type { AppDeps, AppEnv } from '@/http/types';

const factory = createFactory<AppEnv>();

export const healthHandler = (deps: AppDeps) =>
  factory.createHandlers(async (c) => {
    const health = await deps.health.check(c.var.logger);
    return c.json(health, health.status === 'ok' ? 200 : 503);
  });
