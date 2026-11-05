import type { Hono } from 'hono';

import { identityRoutes } from '@/domain/identity/identity.routes';
import { publishingRoutes } from '@/domain/publishing/publishing.routes';
import type { AppDeps, AppEnv } from '@/http/types';

import { healthHandler } from './health';

export function registerRoutes(app: Hono<AppEnv>, deps: AppDeps) {
  app.get('/api/health', ...healthHandler(deps));
  app.get('/api/admin/health', ...healthHandler(deps));
  app.route('/api', identityRoutes(deps));
  app.route('/api', publishingRoutes(deps));
}
