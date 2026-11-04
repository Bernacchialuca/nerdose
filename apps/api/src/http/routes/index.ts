import type { Hono } from 'hono';

import type { AppDeps, AppEnv } from '@/http/types';

import { healthHandler } from './health';

export function registerRoutes(app: Hono<AppEnv>, deps: AppDeps) {
  app.get('/api/health', ...healthHandler(deps));
  app.get('/api/admin/health', ...healthHandler(deps));
}
