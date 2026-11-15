import { zValidator } from '@hono/zod-validator';
import { createFactory } from 'hono/factory';

import { playerSession } from '@/http/middleware/player-session';
import type { AppDeps, AppEnv } from '@/http/types';
import { validationHook } from '@/http/validation-hook';

import { myStatsQuerySchema } from './progress.schema';

const factory = createFactory<AppEnv>();

export const getMyStats = (deps: AppDeps) =>
  factory.createHandlers(
    playerSession(deps.identity, 'required'),
    zValidator('query', myStatsQuerySchema, validationHook),
    async (c) => {
      const { history_before } = c.req.valid('query');
      return c.json(
        await deps.myStats.myStats(
          c.var.player!.id,
          deps.myStats.currentDay(),
          c.var.locale,
          history_before ?? null,
        ),
      );
    },
  );
