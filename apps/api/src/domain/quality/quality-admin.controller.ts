import { zValidator } from '@hono/zod-validator';
import { createFactory } from 'hono/factory';

import type { AppDeps, AppEnv } from '@/http/types';
import { validationHook } from '@/http/validation-hook';

import { voidParamSchema, voidRequestSchema } from './void.schema';

const factory = createFactory<AppEnv>();

export const voidChallenge = (deps: AppDeps) =>
  factory.createHandlers(
    zValidator('param', voidParamSchema, validationHook),
    zValidator('json', voidRequestSchema, validationHook),
    async (c) =>
      c.json(
        await deps.voids.void(c.req.valid('param').challenge_id, c.req.valid('json'), c.var.logger),
      ),
  );
