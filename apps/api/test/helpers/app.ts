import type { Logger } from 'pino';

import { EmptyChallengesRepository } from '@/domain/publishing/publishing.repository';
import { PublishingService } from '@/domain/publishing/publishing.service';
import { TodayCache } from '@/infra/cache/today-cache';
import { systemClock } from '@/shared/clock';
import type { IdentityService } from '@/domain/identity/identity.service';
import { buildApp } from '@/http/app';
import type { AppDeps } from '@/http/types';

import { captureLogger } from './logger';

export const TEST_CONFIG = {
  WEB_ORIGIN: 'http://localhost:5173',
  ADMIN_ORIGIN: 'http://localhost:5174',
  TRUST_PROXY_HEADER: 'x-forwarded-for',
  LAUNCH_DATE: '2026-11-24',
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
    publishing:
      overrides.publishing ??
      new PublishingService({
        cache: new TodayCache(new EmptyChallengesRepository(), systemClock),
        clock: systemClock,
        launchDate: TEST_CONFIG.LAUNCH_DATE,
      }),
  });
  return { app, lines: captured.lines };
}
