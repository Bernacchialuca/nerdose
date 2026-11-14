import { execFile, type ExecFileException } from 'node:child_process';

export type ExecResult = {
  readonly error: ExecFileException | null;
  readonly stdout: string;
  readonly stderr: string;
};

export type ExecOptions = {
  readonly cwd?: string;
  readonly timeout: number;
  readonly killSignal: 'SIGKILL';
  readonly maxBuffer: number;
  readonly env: NodeJS.ProcessEnv;
  readonly encoding: 'utf8';
  readonly uid?: number;
  readonly gid?: number;
};

/**
 * `execFile` (never `exec`: no shell) as a promise that resolves with the error instead of
 * rejecting, because a failing snippet is a value here, not an exception. The callback form keeps
 * `stdout` and `stderr` typed, with no `any`.
 */
export function run(
  command: string,
  args: readonly string[],
  options: ExecOptions,
): Promise<ExecResult> {
  return new Promise((resolve) => {
    execFile(command, [...args], options, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}
