import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, inject, it } from 'vitest';

import { freePort, silentServer } from './helpers/net';
import { startGenerator } from './helpers/process';

const CWD = fileURLToPath(new URL('..', import.meta.url));
let running: ReturnType<typeof startGenerator> | undefined;
const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  if (running) await running.stop('SIGKILL');
  running = undefined;
  await Promise.all(closers.splice(0).map((close) => close()));
});

const isStarted = (line: Record<string, unknown>) => line.msg === 'Scheduler started';

describe('proceso del generator', () => {
  it('aborta sin DATABASE_URL, nombrando la variable', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: CWD,
      env: { PATH: process.env.PATH, NODE_ENV: 'test' },
      encoding: 'utf8',
      timeout: 60_000,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('DATABASE_URL');
    expect(result.stdout).not.toContain('Scheduler started');
  });

  it('arranca con la base disponible: rol y scheduler sin jobs', async () => {
    const url = inject('generatorUrl');
    running = startGenerator({ DATABASE_URL: url });
    const started = await running.waitForLog(isStarted);
    expect(started.jobs).toBe(0);
    const all = running.parsed();
    const roleIndex = all.findIndex((line) => line.db_role === 'nerdose_generator');
    expect(roleIndex).toBeGreaterThanOrEqual(0);
    expect(roleIndex).toBeLessThan(all.findIndex(isStarted));
    expect(all.some((line) => 'job' in line)).toBe(false);
    const password = new URL(url).password;
    const raw = running.lines().join('\n');
    expect(raw).not.toContain(password);
    expect(raw).not.toContain(url);
  });

  it('se apaga con SIGTERM y código 0', async () => {
    running = startGenerator({ DATABASE_URL: inject('generatorUrl') });
    await running.waitForLog(isStarted);
    expect(await running.stop('SIGTERM')).toBe(0);
    expect(running.parsed()).toContainEqual(expect.objectContaining({ msg: 'Shutdown complete' }));
  });

  it('un SIGTERM repetido no reinicia el apagado', async () => {
    running = startGenerator({ DATABASE_URL: inject('generatorUrl') });
    await running.waitForLog(isStarted);
    running.kill('SIGTERM');
    running.kill('SIGTERM');
    expect(await running.exited).toBe(0);
    expect(running.parsed().filter((line) => line.msg === 'Shutdown complete')).toHaveLength(1);
  });

  it.each([
    [
      'rechazada',
      async () => `postgres://nerdose_generator:x@127.0.0.1:${await freePort()}/nerdose`,
    ],
    [
      'colgada',
      async () => {
        const silent = await silentServer();
        closers.push(silent.close);
        return `postgres://nerdose_generator:x@127.0.0.1:${silent.port}/nerdose`;
      },
    ],
  ])('con la base %s sale con código 1', async (_name, makeUrl) => {
    const url = await makeUrl();
    const start = Date.now();
    running = startGenerator({ DATABASE_URL: url });
    expect(await running.exited).toBe(1);
    expect(Date.now() - start).toBeLessThan(10_000);
    const all = running.parsed();
    expect(all).toContainEqual(
      expect.objectContaining({
        level: 'fatal',
        msg: 'Database unavailable at startup',
        err: expect.anything(),
      }),
    );
    expect(all.some(isStarted)).toBe(false);
    expect(running.lines().join('\n')).not.toContain(url);
  });
});
