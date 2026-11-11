import { zValidator } from '@hono/zod-validator';
import { createFactory } from 'hono/factory';

import { gameParamSchema } from '@/domain/gameplay/gameplay.schema';
import { playerSession } from '@/http/middleware/player-session';
import { clientIp, limit } from '@/http/middleware/rate-limit';
import type { AppDeps, AppEnv } from '@/http/types';
import { validationHook } from '@/http/validation-hook';

import { reportBodySchema, reportValidationHook } from './quality.schema';

const factory = createFactory<AppEnv>();

export const reportChallenge = (deps: AppDeps) =>
  factory.createHandlers(
    limit({ windowMs: 3_600_000, limit: 10, key: clientIp(deps.config.TRUST_PROXY_HEADER) }),
    playerSession(deps.identity, 'required'),
    zValidator('param', gameParamSchema, validationHook),
    zValidator('json', reportBodySchema, reportValidationHook),
    async (c) => {
      const { game_id } = c.req.valid('param');
      const body = c.req.valid('json');
      const result = await deps.quality.report(
        game_id,
        c.var.player!,
        body,
        { locale: c.var.locale, userAgent: c.req.header('user-agent') },
        c.var.logger,
      );
      return c.json(result, 201);
    },
  );
