import type { Hono } from 'hono';

import { adminAuthExcept } from '@/domain/admin/admin-auth.middleware';
import { adminRoutes } from '@/domain/admin/admin.routes';
import { gameplayRoutes } from '@/domain/gameplay/gameplay.routes';
import { identityRoutes } from '@/domain/identity/identity.routes';
import { publishingRoutes } from '@/domain/publishing/publishing.routes';
import { qualityAdminRoutes } from '@/domain/quality/quality-admin.routes';
import { qualityRoutes } from '@/domain/quality/quality.routes';
import { ensureToday } from '@/http/middleware/ensure-today';
import type { AppDeps, AppEnv } from '@/http/types';

import { healthHandler } from './health';

export function registerRoutes(app: Hono<AppEnv>, deps: AppDeps) {
  app.get('/api/health', ...healthHandler(deps));
  app.get('/api/admin/health', ...healthHandler(deps));
  // Todo /api/admin/* exige JWT salvo login y health; va antes de cualquier ruta de admin.
  app.use(
    '/api/admin/*',
    adminAuthExcept(
      [
        { method: 'POST', path: '/api/admin/login' },
        { method: 'GET', path: '/api/admin/health' },
      ],
      deps.config.ADMIN_JWT_SECRET,
    ),
  );
  app.route('/api/admin', adminRoutes(deps));
  app.route('/api/admin', qualityAdminRoutes(deps));
  app.route('/api', identityRoutes(deps));
  // Solo las rutas que dependen de "hoy" publican el día (single-flight).
  const publishDay = ensureToday(deps.publishing);
  app.use('/api/today', publishDay);
  app.use('/api/games/*', publishDay);
  app.route('/api', publishingRoutes(deps));
  app.route('/api', gameplayRoutes(deps));
  app.route('/api', qualityRoutes(deps));
}
