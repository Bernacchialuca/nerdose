import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({ execFile: vi.fn() }));
vi.mock('node:fs/promises', () => ({
  mkdtemp: vi.fn(),
  writeFile: vi.fn(),
  chown: vi.fn(),
  rm: vi.fn(),
}));

import { execFile } from 'node:child_process';
import { chown, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildChildEnv } from '../../src/runner/child-env';
import { RUN_MAX_BUFFER_BYTES, RUN_TIMEOUT_MS } from '../../src/runner/outcome';
import { runInLanguage } from '../../src/runner/run';

const DIR = '/tmp/polyglot-test';
type Callback = (error: unknown, stdout: string, stderr: string) => void;
const exec = vi.mocked(execFile) as unknown as ReturnType<typeof vi.fn>;

function respond(impl: (cb: Callback) => void = (cb) => cb(null, '1\n', '')): void {
  exec.mockImplementation((_c: string, _a: string[], _o: unknown, cb: Callback) => impl(cb));
}

beforeEach(() => {
  vi.mocked(mkdtemp).mockResolvedValue(DIR);
  vi.mocked(writeFile).mockResolvedValue(undefined);
  vi.mocked(chown).mockResolvedValue(undefined);
  vi.mocked(rm).mockResolvedValue(undefined);
  vi.spyOn(process, 'getuid').mockReturnValue(1000);
  respond();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  exec.mockReset();
});

describe('runInLanguage (unit)', () => {
  it('refuses to run as root without RUNNER_* (TS-25)', async () => {
    vi.spyOn(process, 'getuid').mockReturnValue(0);
    vi.stubEnv('RUNNER_UID', undefined);
    vi.stubEnv('RUNNER_GID', undefined);
    await expect(runInLanguage('js', 'console.log(1);')).resolves.toEqual({
      ok: false,
      kind: 'runtime_error',
      stderr: 'runner_requires_non_root',
      durationMs: 0,
    });
    expect(exec).not.toHaveBeenCalled();
    expect(mkdtemp).not.toHaveBeenCalled();
  });

  it('calls execFile with the expected options (TS-26)', async () => {
    expect(RUN_TIMEOUT_MS).toBe(10_000);
    expect(RUN_MAX_BUFFER_BYTES).toBe(1_048_576);

    vi.stubEnv('DATABASE_URL', 'postgres://x');
    const outcome = await runInLanguage('js', 'SRC');
    expect(outcome).toMatchObject({ ok: true, stdout: '1\n' });
    expect(writeFile).toHaveBeenCalledWith(join(DIR, 'main.js'), 'SRC', 'utf8');
    const [command, args, opts] = exec.mock.calls[0] as [string, string[], Record<string, unknown>];
    expect([command, args]).toEqual(['node', ['main.js']]);
    expect(opts).toEqual({
      cwd: DIR,
      timeout: 10_000,
      killSignal: 'SIGKILL',
      maxBuffer: 1_048_576,
      env: buildChildEnv(process.env),
      encoding: 'utf8',
    });
    expect(opts).not.toHaveProperty('shell');
    expect(opts).not.toHaveProperty('uid');
    expect(opts.env).not.toHaveProperty('DATABASE_URL');

    exec.mockClear();
    await runInLanguage('java', 'SRC');
    expect(writeFile).toHaveBeenLastCalledWith(join(DIR, 'Main.java'), 'SRC', 'utf8');
    expect(exec.mock.calls[0]?.slice(0, 2)).toEqual(['java', ['Main.java']]);

    exec.mockClear();
    await runInLanguage('go', 'SRC');
    const [build, run] = exec.mock.calls as [
      [string, string[], { timeout: number }],
      [string, string[], { timeout: number }],
    ];
    expect([build[0], build[1], build[2].timeout]).toEqual([
      'go',
      ['build', '-o', 'main', 'main.go'],
      10_000,
    ]);
    expect(run[0]).toBe(join(DIR, 'main'));
    expect(run[1]).toEqual([]);
    expect(run[2]).toMatchObject({
      cwd: DIR,
      killSignal: 'SIGKILL',
      maxBuffer: 1_048_576,
      encoding: 'utf8',
    });
    expect(run[2].timeout).toBeGreaterThanOrEqual(1);
    expect(run[2].timeout).toBeLessThanOrEqual(10_000);

    exec.mockClear();
    await runInLanguage('js', 'SRC', { timeoutMs: 1500 });
    expect((exec.mock.calls[0] as [string, string[], { timeout: number }])[2].timeout).toBe(1500);
  });

  it('runs as RUNNER_UID/RUNNER_GID after chown when root (TS-26d)', async () => {
    vi.spyOn(process, 'getuid').mockReturnValue(0);
    vi.stubEnv('RUNNER_UID', '1001');
    vi.stubEnv('RUNNER_GID', '1001');
    await runInLanguage('js', 'SRC');
    expect(chown).toHaveBeenCalledWith(DIR, 1001, 1001);
    expect(chown).toHaveBeenCalledWith(join(DIR, 'main.js'), 1001, 1001);
    const opts = (exec.mock.calls[0] as [string, string[], Record<string, unknown>])[2];
    expect(opts).toMatchObject({ uid: 1001, gid: 1001 });
    const lastChown = vi.mocked(chown).mock.invocationCallOrder.at(-1) as number;
    expect(lastChown).toBeLessThan(exec.mock.invocationCallOrder[0] as number);
  });

  it('classifies failures without throwing', async () => {
    respond((cb) => cb({ code: 1 }, '', 'boom'));
    await expect(runInLanguage('js', 'x')).resolves.toMatchObject({
      ok: false,
      kind: 'runtime_error',
      stderr: 'boom',
    });
    respond((cb) => cb({ code: 'ENOENT', message: 'spawn go ENOENT' }, '', ''));
    await expect(runInLanguage('go', 'x')).resolves.toMatchObject({
      ok: false,
      kind: 'toolchain_missing',
      stderr: 'spawn go ENOENT',
    });
    respond((cb) => cb({ code: 1 }, '', './main.go:3:2: declared and not used'));
    await expect(runInLanguage('go', 'x')).resolves.toMatchObject({
      ok: false,
      kind: 'compile_error',
    });
    expect(exec).toHaveBeenCalledTimes(3);
  });

  describe('cleanup (TS-27)', () => {
    it.each([
      ['success', () => respond()],
      ['failure', () => respond((cb) => cb({ code: 1 }, '', 'boom'))],
    ])('removes the directory on %s', async (_name, setup) => {
      setup();
      const outcome = await runInLanguage('js', 'x');
      expect(outcome).toHaveProperty('ok');
      expect(rm).toHaveBeenCalledTimes(1);
      expect(rm).toHaveBeenCalledWith(DIR, { recursive: true, force: true });
    });

    it('removes the directory and propagates an unexpected error', async () => {
      exec.mockImplementation(() => {
        throw new Error('unexpected');
      });
      await expect(runInLanguage('js', 'x')).rejects.toThrow('unexpected');
      expect(rm).toHaveBeenCalledTimes(1);
      expect(rm).toHaveBeenCalledWith(DIR, { recursive: true, force: true });
    });
  });
});
