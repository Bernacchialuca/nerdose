import { chown, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Language } from '../emit/languages';
import { buildChildEnv } from './child-env';
import { run, type ExecOptions, type ExecResult } from './exec';
import {
  classifyFailure,
  RUN_MAX_BUFFER_BYTES,
  RUN_TIMEOUT_MS,
  type RunOptions,
  type RunOutcome,
  type RunPhase,
} from './outcome';
import { resolveRunAs } from './run-as';

const FILE_NAME: Record<Language, string> = { js: 'main.js', go: 'main.go', java: 'Main.java' };

export async function runInLanguage(
  lang: Language,
  source: string,
  options: RunOptions = {},
): Promise<RunOutcome> {
  const runAs = resolveRunAs({ uid: process.getuid?.(), env: process.env });
  if (runAs.kind === 'refuse') {
    return { ok: false, kind: 'runtime_error', stderr: 'runner_requires_non_root', durationMs: 0 };
  }

  const timeoutMs = options.timeoutMs ?? RUN_TIMEOUT_MS;
  const start = performance.now();
  const deadline = start + timeoutMs;
  const elapsed = (): number => Math.round(performance.now() - start);
  const dir = await mkdtemp(join(tmpdir(), 'polyglot-'));
  try {
    const file = join(dir, FILE_NAME[lang]);
    await writeFile(file, source, 'utf8');
    if (runAs.kind === 'as') {
      // mkdtemp creates the directory as 0700 owned by the current user (root): without this the
      // child, running as RUNNER_UID, could neither read the source nor write the Go binary.
      // Not verifiable without root; to be confirmed when the hosting is defined.
      await chown(dir, runAs.uid, runAs.gid);
      await chown(file, runAs.uid, runAs.gid);
    }

    const exec = (command: string, args: string[], timeout: number): Promise<ExecResult> => {
      const execOptions: ExecOptions = {
        cwd: dir,
        timeout,
        killSignal: 'SIGKILL',
        maxBuffer: RUN_MAX_BUFFER_BYTES,
        env: buildChildEnv(process.env),
        encoding: 'utf8',
        ...(runAs.kind === 'as' ? { uid: runAs.uid, gid: runAs.gid } : {}),
      };
      return run(command, args, execOptions);
    };

    const fail = (phase: RunPhase, result: ExecResult): RunOutcome | null => {
      const { error } = result;
      if (error === null) return null;
      const kind = classifyFailure(lang, phase, error, result.stderr);
      const stderr = kind === 'toolchain_missing' ? error.message : result.stderr;
      return { ok: false, kind, stderr, durationMs: elapsed() };
    };

    let last: ExecResult;
    if (lang === 'js') {
      last = await exec('node', ['main.js'], timeoutMs);
    } else if (lang === 'java') {
      last = await exec('java', ['Main.java'], timeoutMs);
    } else {
      // Not `go run`: it launches the compiled binary as its own child process, so when the
      // timeout SIGKILLs `go run` the binary survives as an orphan burning CPU. Building first
      // and executing the binary directly makes the timeout kill the real process. One budget
      // (`timeoutMs`) is shared by both phases.
      const build = await exec('go', ['build', '-o', 'main', 'main.go'], timeoutMs);
      const buildFailure = fail('build', build);
      if (buildFailure) return buildFailure;
      const remaining = Math.max(1, Math.round(deadline - performance.now()));
      last = await exec(join(dir, 'main'), [], remaining);
    }
    const failure = fail('run', last);
    if (failure) return failure;
    return { ok: true, stdout: last.stdout, durationMs: elapsed() };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
