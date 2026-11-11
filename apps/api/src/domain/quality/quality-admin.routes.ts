import { Hono } from 'hono';

import type { AppDeps, AppEnv } from '@/http/types';

import { voidChallenge } from './quality-admin.controller';

export const qualityAdminRoutes = (deps: AppDeps) =>
  new Hono<AppEnv>().post('/challenges/:challenge_id/void', ...voidChallenge(deps));
