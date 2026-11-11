import { Hono } from 'hono';

import type { AppDeps, AppEnv } from '@/http/types';

import { listReports, login, updateReport } from './admin.controller';

export const adminRoutes = (deps: AppDeps) =>
  new Hono<AppEnv>()
    .post('/login', ...login(deps))
    .get('/reports', ...listReports(deps))
    .patch('/reports/:report_id', ...updateReport(deps));
