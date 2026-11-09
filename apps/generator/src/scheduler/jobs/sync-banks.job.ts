import type { Dataset } from '@nerdose/content';
import type { Db } from '@nerdose/db';

import { syncBanks } from '@/domain/content-banks/sync-banks.service';
import type { JobBody } from '@/scheduler/run-job';

export type SyncBanksJobDeps = { db: Db; loadDataset?: () => Dataset };

export function syncBanksJob(deps: SyncBanksJobDeps): JobBody {
  return async ({ log }) => {
    // loadDataset es síncrona: llamarla dentro del cuerpo deja su error registrado en job_runs.
    const summary = await syncBanks({ db: deps.db, log, loadDataset: deps.loadDataset });
    log.info(summary, 'Banks synced');
    return { summary };
  };
}
