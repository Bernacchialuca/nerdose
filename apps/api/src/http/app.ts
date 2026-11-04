import { Hono } from 'hono';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';

import { errorMessage } from './error-messages';
import { createErrorHandler } from './middleware/error-handler';
import { requestContext } from './middleware/request-context';
import { registerRoutes } from './routes';
import type { AppDeps, AppEnv } from './types';

export function buildApp(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(requestContext(deps.logger));
  app.use(secureHeaders());
  // Sin CORS: mismo origen (ADR-009).

  app.onError(createErrorHandler(deps.logger));
  app.notFound((c) => c.json({ error: { code: 'not_found', message: errorMessage('not_found') } }, 404));

  registerRoutes(app, deps);
  return app;
}
