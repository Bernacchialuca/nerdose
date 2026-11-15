import { Hono } from 'hono';

import type { AppDeps, AppEnv } from '@/http/types';

import {
  getContentStock,
  getMetrics,
  listGenerationFailures,
  listReports,
  listUpcoming,
  login,
  updateReport,
} from './admin.controller';

export const adminRoutes = (deps: AppDeps) =>
  new Hono<AppEnv>()
    .post('/login', ...login(deps))
    .get('/reports', ...listReports(deps))
    .patch('/reports/:report_id', ...updateReport(deps))
    .get('/challenges/upcoming', ...listUpcoming(deps))
    .get('/generation-failures', ...listGenerationFailures(deps))
    .get('/content/stock', ...getContentStock(deps))
    .get('/metrics', ...getMetrics(deps));
