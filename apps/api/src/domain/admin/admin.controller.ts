import { zValidator } from '@hono/zod-validator';
import { createFactory } from 'hono/factory';

import { clientIp, limit } from '@/http/middleware/rate-limit';
import type { AppDeps, AppEnv } from '@/http/types';
import { validationHook } from '@/http/validation-hook';

import {
  loginBodySchema,
  metricsQuerySchema,
  reportParamSchema,
  reportPatchSchema,
  reportsQuerySchema,
  upcomingQuerySchema,
} from './admin.schema';

const factory = createFactory<AppEnv>();

export const login = (deps: AppDeps) =>
  factory.createHandlers(
    // Cuenta todos los intentos (correctos e incorrectos), antes de evaluar la contraseña.
    limit({ windowMs: 900_000, limit: 5, key: clientIp(deps.config) }),
    zValidator('json', loginBodySchema, validationHook),
    async (c) => c.json(await deps.admin.login(c.req.valid('json').password, c.var.logger)),
  );

export const listReports = (deps: AppDeps) =>
  factory.createHandlers(zValidator('query', reportsQuerySchema, validationHook), async (c) =>
    c.json(await deps.admin.listReportGroups(c.req.valid('query').status)),
  );

export const updateReport = (deps: AppDeps) =>
  factory.createHandlers(
    zValidator('param', reportParamSchema, validationHook),
    zValidator('json', reportPatchSchema, validationHook),
    async (c) =>
      c.json(
        await deps.admin.updateReport(
          c.req.valid('param').report_id,
          c.req.valid('json').status,
          c.var.logger,
        ),
      ),
  );

export const listUpcoming = (deps: AppDeps) =>
  factory.createHandlers(zValidator('query', upcomingQuerySchema, validationHook), async (c) =>
    c.json(await deps.adminContent.upcoming(c.req.valid('query').days)),
  );

export const listGenerationFailures = (deps: AppDeps) =>
  factory.createHandlers(async (c) => c.json(await deps.adminContent.generationFailures()));

export const getContentStock = (deps: AppDeps) =>
  factory.createHandlers(async (c) => c.json(await deps.adminContent.stock()));

export const getMetrics = (deps: AppDeps) =>
  factory.createHandlers(
    zValidator(
      'query',
      metricsQuerySchema(() => deps.adminMetrics.currentDay()),
      validationHook,
    ),
    async (c) => {
      const { from, to } = c.req.valid('query');
      return c.json(await deps.adminMetrics.metrics(from, to, deps.adminMetrics.currentDay()));
    },
  );
