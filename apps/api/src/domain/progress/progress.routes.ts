import { Hono } from 'hono';

import type { AppDeps, AppEnv } from '@/http/types';

import { getMyStats } from './progress.controller';

export const progressRoutes = (deps: AppDeps) =>
  new Hono<AppEnv>().get('/me/stats', ...getMyStats(deps));
