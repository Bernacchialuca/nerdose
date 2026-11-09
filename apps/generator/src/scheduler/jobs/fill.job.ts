import { runFill, type FillDeps } from '@/domain/challenge-publishing/fill.service';
import type { JobBody } from '@/scheduler/run-job';

export function fillJob(deps: FillDeps): JobBody {
  return ({ now, log, signal }) => runFill({ now, log, signal }, deps);
}
