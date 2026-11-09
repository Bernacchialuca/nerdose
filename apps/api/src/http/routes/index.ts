import type { Hono } from 'hono';

import { gameplayRoutes } from '@/domain/gameplay/gameplay.routes';
import { identityRoutes } from '@/domain/identity/identity.routes';
import { publishingRoutes } from '@/domain/publishing/publishing.routes';
import { ensureToday } from '@/http/middleware/ensure-today';
import type { AppDeps, AppEnv } from '@/http/types';

import { healthHandler } from './health';

export function registerRoutes(app: Hono<AppEnv>, deps: AppDeps) {
  app.get('/api/health', ...healthHandler(deps));
  app.get('/api/admin/health', ...healthHandler(deps));
  app.route('/api', identityRoutes(deps));
  // Solo las rutas que dependen de "hoy" publican el día (single-flight).
  const publishDay = ensureToday(deps.publishing);
  app.use('/api/today', publishDay);
  app.use('/api/games/*', publishDay);
  app.route('/api', publishingRoutes(deps));
  app.route('/api', gameplayRoutes(deps));
}
