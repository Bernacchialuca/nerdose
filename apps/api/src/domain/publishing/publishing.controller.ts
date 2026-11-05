import { createFactory } from 'hono/factory';

import { playerSession } from '@/http/middleware/player-session';
import type { AppDeps, AppEnv } from '@/http/types';

const factory = createFactory<AppEnv>();

export const getToday = (deps: AppDeps) =>
  factory.createHandlers(playerSession(deps.identity, 'optional'), (c) =>
    c.json(deps.publishing.getToday({ hasSession: c.var.player !== null })),
  );
