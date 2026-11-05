import { Hono } from 'hono';

import type { AppDeps, AppEnv } from '@/http/types';

import { getToday } from './publishing.controller';

export const publishingRoutes = (deps: AppDeps) =>
  new Hono<AppEnv>().get('/today', ...getToday(deps));
