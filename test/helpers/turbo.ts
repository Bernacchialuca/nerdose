import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import { REPO_ROOT } from './repo';

export interface TurboDryRunTask {
  taskId: string;
  command: string;
  resolvedTaskDefinition: { persistent: boolean; cache: boolean };
}

export interface TurboDryRun {
  tasks: TurboDryRunTask[];
}

/** Runs `turbo run <task> --dry=json` and returns the resolved task graph without executing anything. */
export function turboDryRun(task: string): TurboDryRun {
  // Nested inside `turbo run test`: drop inherited TURBO_* variables so the inner run is independent.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('TURBO_')));
  const result = spawnSync(
    join(REPO_ROOT, 'node_modules/.bin/turbo'),
    ['run', task, '--dry=json', '--no-daemon'],
    { cwd: REPO_ROOT, encoding: 'utf8', env },
  );
  if (result.error !== undefined || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr;
    throw new Error(`turbo run ${task} --dry=json failed: ${detail}`);
  }
  return JSON.parse(result.stdout) as TurboDryRun;
}
