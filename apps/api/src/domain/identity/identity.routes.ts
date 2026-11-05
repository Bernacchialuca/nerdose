import { Hono } from 'hono';

import type { AppDeps, AppEnv } from '@/http/types';

import { createSession, updatePreferences } from './identity.controller';

export const identityRoutes = (deps: AppDeps) =>
  new Hono<AppEnv>()
    .post('/session', ...createSession(deps))
    .patch('/me/preferences', ...updatePreferences(deps));
