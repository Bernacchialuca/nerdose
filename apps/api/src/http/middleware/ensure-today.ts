import { createMiddleware } from 'hono/factory';

import type { PublishingService } from '@/domain/publishing/publishing.service';
import type { AppEnv } from '@/http/types';

/** Publica el día perezosamente (single-flight) antes de las rutas que dependen de "hoy". */
export const ensureToday = (publishing: Pick<PublishingService, 'ensureToday'>) =>
  createMiddleware<AppEnv>(async (_c, next) => {
    await publishing.ensureToday();
    await next();
  });
