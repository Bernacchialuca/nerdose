import { Hono } from 'hono';

import type { AppDeps, AppEnv } from '@/http/types';

import { regenerateChallenge } from './publishing-admin.controller';

export const publishingAdminRoutes = (deps: AppDeps) =>
  new Hono<AppEnv>().post('/challenges/:challenge_id/regenerate', ...regenerateChallenge(deps));
