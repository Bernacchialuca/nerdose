import { readRunnerEnv } from '../config/env';

export type RunAs =
  | { kind: 'current' }
  | { kind: 'as'; uid: number; gid: number }
  | { kind: 'refuse' };

/** Running the snippet as uid 0 would void the non-root rule, so root without ids refuses. */
export function resolveRunAs(input: { uid: number | undefined; env: NodeJS.ProcessEnv }): RunAs {
  if (input.uid !== 0) return { kind: 'current' };
  const ids = readRunnerEnv(input.env);
  return ids === null ? { kind: 'refuse' } : { kind: 'as', ...ids };
}
