import type { Locale } from '@nerdose/core';
import type { Player } from '@nerdose/db';
import type { Logger } from 'pino';

import type { ApiEnv } from '@/config/env';
import type { AdminContentService } from '@/domain/admin/admin-content.service';
import type { AdminMetricsService } from '@/domain/admin/admin-metrics.service';
import type { AdminService } from '@/domain/admin/admin.service';
import type { GameplayService } from '@/domain/gameplay/gameplay.service';
import type { IdentityService } from '@/domain/identity/identity.service';
import type { QualityService } from '@/domain/quality/quality.service';
import type { VoidService } from '@/domain/quality/void.service';
import type { PublishingService } from '@/domain/publishing/publishing.service';
import type { RegenerationService } from '@/domain/publishing/regeneration.service';
import type { Health } from '@/infra/database/health';

export type AppDeps = {
  logger: Logger;
  health: { check(log: Logger): Promise<Health> };
  config: Pick<
    ApiEnv,
    | 'WEB_ORIGIN'
    | 'ADMIN_ORIGIN'
    | 'TRUST_PROXY_HEADER'
    | 'LAUNCH_DATE'
    | 'ADMIN_PASSWORD_HASH'
    | 'ADMIN_JWT_SECRET'
  >;
  identity: IdentityService;
  publishing: Pick<PublishingService, 'getToday' | 'ensureToday'>;
  gameplay: Pick<GameplayService, 'getToday' | 'start' | 'move' | 'acknowledgeVoid'>;
  quality: Pick<QualityService, 'report'>;
  admin: Pick<AdminService, 'login' | 'listReportGroups' | 'updateReport'>;
  voids: Pick<VoidService, 'void'>;
  adminContent: Pick<AdminContentService, 'upcoming' | 'generationFailures' | 'stock'>;
  adminMetrics: Pick<AdminMetricsService, 'currentDay' | 'metrics'>;
  regeneration: Pick<RegenerationService, 'regenerate'>;
};

export type AppEnv = {
  Variables: { requestId: string; logger: Logger; locale: Locale; player: Player | null };
};
