import { zValidator } from '@hono/zod-validator';
import { createFactory } from 'hono/factory';

import type { AppDeps, AppEnv } from '@/http/types';
import { validationHook } from '@/http/validation-hook';

import { regenerateParamSchema } from './regeneration.schema';

const factory = createFactory<AppEnv>();

export const regenerateChallenge = (deps: AppDeps) =>
  factory.createHandlers(zValidator('param', regenerateParamSchema, validationHook), async (c) =>
    c.json(
      await deps.regeneration.regenerate(c.req.valid('param').challenge_id, c.var.logger),
      202,
    ),
  );
