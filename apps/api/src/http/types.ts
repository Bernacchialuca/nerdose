import type { Locale } from '@nerdose/core';
import type { Player } from '@nerdose/db';
import type { Logger } from 'pino';

import type { ApiEnv } from '@/config/env';
import type { IdentityService } from '@/domain/identity/identity.service';
import type { Health } from '@/infra/database/health';

export type AppDeps = {
  logger: Logger;
  health: { check(log: Logger): Promise<Health> };
  config: Pick<ApiEnv, 'WEB_ORIGIN' | 'ADMIN_ORIGIN' | 'TRUST_PROXY_HEADER'>;
  identity: IdentityService;
};

export type AppEnv = {
  Variables: { requestId: string; logger: Logger; locale: Locale; player: Player | null };
};
