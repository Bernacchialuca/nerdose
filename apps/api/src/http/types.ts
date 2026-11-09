import type { Locale } from '@nerdose/core';
import type { Player } from '@nerdose/db';
import type { Logger } from 'pino';

import type { ApiEnv } from '@/config/env';
import type { GameplayService } from '@/domain/gameplay/gameplay.service';
import type { IdentityService } from '@/domain/identity/identity.service';
import type { PublishingService } from '@/domain/publishing/publishing.service';
import type { Health } from '@/infra/database/health';

export type AppDeps = {
  logger: Logger;
  health: { check(log: Logger): Promise<Health> };
  config: Pick<ApiEnv, 'WEB_ORIGIN' | 'ADMIN_ORIGIN' | 'TRUST_PROXY_HEADER' | 'LAUNCH_DATE'>;
  identity: IdentityService;
  publishing: Pick<PublishingService, 'getToday' | 'ensureToday'>;
  gameplay: Pick<GameplayService, 'getToday' | 'start'>;
};

export type AppEnv = {
  Variables: { requestId: string; logger: Logger; locale: Locale; player: Player | null };
};
