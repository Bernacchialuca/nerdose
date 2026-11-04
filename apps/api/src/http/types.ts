import type { Logger } from 'pino';

import type { Health } from '@/infra/database/health';

export type AppDeps = {
  logger: Logger;
  health: { check(log: Logger): Promise<Health> };
};

export type AppEnv = { Variables: { requestId: string; logger: Logger } };
