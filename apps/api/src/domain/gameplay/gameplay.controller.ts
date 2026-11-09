import { zValidator } from '@hono/zod-validator';
import { createFactory } from 'hono/factory';

import { playerSession } from '@/http/middleware/player-session';
import { limit } from '@/http/middleware/rate-limit';
import type { AppDeps, AppEnv } from '@/http/types';
import { validationHook } from '@/http/validation-hook';

import { challengeNumberBodySchema, gameParamSchema } from './gameplay.schema';

const factory = createFactory<AppEnv>();

export const getGameToday = (deps: AppDeps) =>
  factory.createHandlers(
    playerSession(deps.identity, 'optional'),
    zValidator('param', gameParamSchema, validationHook),
    async (c) => {
      const { game_id } = c.req.valid('param');
      return c.json(await deps.gameplay.getToday(game_id, c.var.player, c.var.locale));
    },
  );

export const startPlay = (deps: AppDeps) =>
  factory.createHandlers(
    playerSession(deps.identity, 'required'),
    limit({ windowMs: 60_000, limit: 30, key: (c) => c.var.player!.id }),
    zValidator('param', gameParamSchema, validationHook),
    zValidator('json', challengeNumberBodySchema, validationHook),
    async (c) => {
      const { game_id } = c.req.valid('param');
      const body = c.req.valid('json');
      return c.json(
        await deps.gameplay.start(game_id, c.var.player!, body.challenge_number, c.var.logger),
      );
    },
  );
