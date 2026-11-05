import { AppError } from '@nerdose/core';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';

import { errorMessage } from './error-messages';
import { createErrorHandler } from './middleware/error-handler';
import { locale } from './middleware/locale';
import { requestContext } from './middleware/request-context';
import { clientIp, limit } from './middleware/rate-limit';
import { originAndContentType } from './middleware/security';
import { registerRoutes } from './routes';
import type { AppDeps, AppEnv } from './types';

const isAdminPath = (path: string) => path === '/api/admin' || path.startsWith('/api/admin/');

export function buildApp(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(requestContext(deps.logger));
  app.use(locale());
  app.use(secureHeaders());
  app.use(
    bodyLimit({
      maxSize: 64 * 1024,
      onError: () => {
        throw new AppError('validation_error');
      },
    }),
  );
  // Sin CORS: mismo origen (ADR-009).

  const adminOrigin = originAndContentType(deps.config.ADMIN_ORIGIN);
  const webOrigin = originAndContentType(deps.config.WEB_ORIGIN);
  app.use('/api/*', (c, next) =>
    isAdminPath(c.req.path) ? adminOrigin(c, next) : webOrigin(c, next),
  );

  // GET /api/* de jugador: un solo balde por IP (ADR-012).
  const playerReads = limit({
    windowMs: 60_000,
    limit: 600,
    key: clientIp(deps.config.TRUST_PROXY_HEADER),
  });
  app.use('/api/*', (c, next) =>
    c.req.method === 'GET' && !isAdminPath(c.req.path) ? playerReads(c, next) : next(),
  );

  app.onError(createErrorHandler(deps.logger));
  app.notFound((c) =>
    c.json({ error: { code: 'not_found', message: errorMessage('not_found', c.var.locale) } }, 404),
  );

  registerRoutes(app, deps);
  return app;
}
