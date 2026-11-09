import { Hono } from 'hono';

import type { AppDeps, AppEnv } from '@/http/types';

import { getGameToday, startPlay } from './gameplay.controller';

export const gameplayRoutes = (deps: AppDeps) =>
  new Hono<AppEnv>()
    .get('/games/:game_id/today', ...getGameToday(deps))
    .post('/games/:game_id/today/start', ...startPlay(deps));
