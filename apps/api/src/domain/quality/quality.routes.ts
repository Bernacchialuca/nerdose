import { Hono } from 'hono';

import type { AppDeps, AppEnv } from '@/http/types';

import { reportChallenge } from './quality.controller';

export const qualityRoutes = (deps: AppDeps) =>
  new Hono<AppEnv>().post('/games/:game_id/today/report', ...reportChallenge(deps));
