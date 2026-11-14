import type { ExecFileException } from 'node:child_process';
import type { Language } from '../emit/languages';

export const RUN_TIMEOUT_MS = 10_000;
export const RUN_MAX_BUFFER_BYTES = 1_048_576;

export type RunFailureKind =
  | 'timeout'
  | 'compile_error'
  | 'runtime_error'
  | 'toolchain_missing'
  | 'output_too_large';

export type RunOutcome =
  | { ok: true; stdout: string; durationMs: number }
  | { ok: false; kind: RunFailureKind; stderr: string; durationMs: number };

export type RunOptions = { timeoutMs?: number };

export type RunPhase = 'build' | 'run';

type FailureError = Pick<ExecFileException, 'code' | 'killed' | 'signal'>;

export function classifyFailure(
  lang: Language,
  phase: RunPhase,
  error: FailureError,
  stderr: string,
): RunFailureKind {
  if (error.code === 'ENOENT') return 'toolchain_missing';
  if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') return 'output_too_large';
  if (error.killed && error.signal === 'SIGKILL') return 'timeout';
  if (lang === 'go' && phase === 'build') return 'compile_error';
  if (lang === 'java' && stderr.includes('error: compilation failed')) return 'compile_error';
  if (lang === 'js' && /^SyntaxError: /m.test(stderr)) return 'compile_error';
  return 'runtime_error';
}
