export type RunnerIds = { readonly uid: number; readonly gid: number };

function parsePositiveInt(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

/**
 * Only place of the package that reads environment variables. Callers pass `process.env` on each
 * call (never at import time) so tests can change it.
 */
export function readRunnerEnv(env: NodeJS.ProcessEnv): RunnerIds | null {
  const uid = parsePositiveInt(env.RUNNER_UID);
  const gid = parsePositiveInt(env.RUNNER_GID);
  return uid === null || gid === null ? null : { uid, gid };
}
