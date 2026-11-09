import { createFactory } from 'hono/factory';

import { playerSession } from '@/http/middleware/player-session';
import type { AppDeps, AppEnv } from '@/http/types';

const factory = createFactory<AppEnv>();

export const getToday = (deps: AppDeps) =>
  factory.createHandlers(playerSession(deps.identity, 'optional'), async (c) =>
    c.json(await deps.publishing.getToday({ player: c.var.player, locale: c.var.locale })),
  );
