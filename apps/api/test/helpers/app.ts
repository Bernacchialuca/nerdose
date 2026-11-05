import type { Logger } from 'pino';

import type { IdentityService } from '@/domain/identity/identity.service';
import { buildApp } from '@/http/app';
import type { AppDeps } from '@/http/types';

import { captureLogger } from './logger';

export const TEST_CONFIG = {
  WEB_ORIGIN: 'http://localhost:5173',
  ADMIN_ORIGIN: 'http://localhost:5174',
  TRUST_PROXY_HEADER: 'x-forwarded-for',
};

export const MUTATION_HEADERS = {
  Origin: 'http://localhost:5173',
  'Content-Type': 'application/json',
};

export const TEST_ENV = {
  LAUNCH_DATE: '2026-11-24',
  WEB_ORIGIN: 'http://localhost:5173',
  ADMIN_ORIGIN: 'http://localhost:5174',
};

export const stubIdentity = new Proxy({} as IdentityService, {
  get: () => () => {
    throw new Error('identity no configurada en este test');
  },
});

export function buildTestApp(
  overrides: Partial<Omit<AppDeps, 'logger'>> & { logger?: Logger } = {},
) {
  const captured = captureLogger();
  const app = buildApp({
    logger: overrides.logger ?? captured.logger,
    health: overrides.health ?? { check: async () => ({ status: 'ok', db: 'ok' }) },
    identity: overrides.identity ?? stubIdentity,
    config: overrides.config ?? TEST_CONFIG,
  });
  return { app, lines: captured.lines };
}
