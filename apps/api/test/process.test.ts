import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { afterEach, describe, expect, inject, it } from 'vitest';

import { createDb } from '@nerdose/db';

import { freePort } from './helpers/net';
import { PAYLOAD } from './helpers/db';
import { MUTATION_HEADERS, TEST_ENV } from './helpers/app';
import { startApi } from './helpers/process';

const CWD = fileURLToPath(new URL('..', import.meta.url));
let running: ReturnType<typeof startApi> | undefined;

afterEach(async () => {
  if (running) await running.stop('SIGKILL');
  running = undefined;
});

const isServerStarted = (line: Record<string, unknown>) => line.msg === 'Server started';

describe('proceso de la api', () => {
  it('aborta sin DATABASE_URL, nombrando la variable y sin abrir el puerto', async () => {
    const port = await freePort();
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: CWD,
      env: { PATH: process.env.PATH, NODE_ENV: 'test', PORT: String(port) },
      encoding: 'utf8',
      timeout: 60_000,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('DATABASE_URL');
    const server = net.createServer();
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('arranca con la base disponible, loguea el rol y responde health', async () => {
    const port = await freePort();
    running = startApi({ PORT: String(port), DATABASE_URL: inject('apiUrl'), ...TEST_ENV });
    const started = await running.waitForLog(isServerStarted);
    expect(started.port).toBe(port);
    const all = running.parsed();
    const roleIndex = all.findIndex((line) => line.db_role === 'nerdose_api');
    expect(roleIndex).toBeGreaterThanOrEqual(0);
    expect(roleIndex).toBeLessThan(all.findIndex(isServerStarted));
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('arranca con el env nuevo y crea una sesión', async () => {
    const port = await freePort();
    running = startApi({ PORT: String(port), DATABASE_URL: inject('apiUrl'), ...TEST_ENV });
    await running.waitForLog(isServerStarted);
    const res = await fetch(`http://127.0.0.1:${port}/api/session`, {
      method: 'POST',
      headers: MUTATION_HEADERS,
      body: '{}',
    });
    expect(res.status).toBe(200);
    expect((await res.json()).created).toBe(true);
    expect(res.headers.get('set-cookie')).toMatch(/^nd_pid=/);
  });

  it('sirve el estado del día', async () => {
    const port = await freePort();
    running = startApi({
      PORT: String(port),
      DATABASE_URL: inject('apiUrl'),
      TRUST_PROXY_HEADER: '',
      ...TEST_ENV,
    });
    await running.waitForLog(isServerStarted);
    const before = new Date().toISOString().slice(0, 10);
    const res = await fetch(`http://127.0.0.1:${port}/api/today`);
    const after = new Date().toISOString().slice(0, 10);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.has_session).toBe(false);
    expect(body.games).toHaveLength(5);
    expect(
      body.games.every((g: { challenge_status: string }) => g.challenge_status === 'none'),
    ).toBe(true);
    expect([before, after]).toContain(body.date);
    expect(body.number === null || typeof body.number === 'number').toBe(true);
    expect(body.seconds_to_reset).toBeGreaterThanOrEqual(1);
    expect(body.seconds_to_reset).toBeLessThanOrEqual(86400);
  });

  it('TS-52 el arranque publica el approved de hoy y sirve el juego', async () => {
    const day = (offset = 0) =>
      new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
    const todayUtc = day();
    const launch = day(-7);
    const owner = createDb(inject('ownerUrl'), { max: 1 });
    try {
      await owner.sql`TRUNCATE TABLE challenges RESTART IDENTITY CASCADE`;
      await owner.sql`
        INSERT INTO challenges (game_id, date, number, payload, status, generator_version, seed, attempt)
        VALUES ('devdle', ${todayUtc}, 8, ${JSON.stringify({ ...PAYLOAD, date: todayUtc })}::jsonb, 'approved', 'test', 'test', 0)`;
    } finally {
      await owner.sql.end({ timeout: 0 });
    }
    const port = await freePort();
    running = startApi({
      PORT: String(port),
      DATABASE_URL: inject('apiUrl'),
      ...TEST_ENV,
      LAUNCH_DATE: launch,
    });
    await running.waitForLog(isServerStarted);
    const res = await fetch(`http://127.0.0.1:${port}/api/games/devdle/today`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      game_id: 'devdle',
      challenge_status: 'published',
      number: 8,
      public_view: { length: 5 },
    });
    expect(body.public_view.possible_categories).toHaveLength(8);
  });

  it('aborta sin WEB_ORIGIN', () => {
    const rest: Record<string, string> = { ...TEST_ENV };
    delete rest.WEB_ORIGIN;
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: CWD,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'test',
        DATABASE_URL: 'postgres://nerdose_api:x@127.0.0.1:1/nerdose',
        ...rest,
      },
      encoding: 'utf8',
      timeout: 60_000,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('WEB_ORIGIN');
  });

  it('arranca con la base caída y responde 503', async () => {
    const [port, dbPort] = [await freePort(), await freePort()];
    running = startApi({
      PORT: String(port),
      DATABASE_URL: `postgres://nerdose_api:x@127.0.0.1:${dbPort}/nerdose`,
      ...TEST_ENV,
    });
    await running.waitForLog(isServerStarted);
    const all = running.parsed();
    const warnIndex = all.findIndex(
      (line) => line.level === 'warn' && line.msg === 'Database unavailable at startup',
    );
    expect(warnIndex).toBeGreaterThanOrEqual(0);
    expect(warnIndex).toBeLessThan(all.findIndex(isServerStarted));
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'degraded', db: 'error' });
  });

  it('se apaga de forma ordenada con SIGTERM', async () => {
    const port = await freePort();
    running = startApi({ PORT: String(port), DATABASE_URL: inject('apiUrl'), ...TEST_ENV });
    await running.waitForLog(isServerStarted);
    const code = await running.stop('SIGTERM');
    expect(code).toBe(0);
    expect(running.parsed()).toContainEqual(expect.objectContaining({ msg: 'Shutdown complete' }));
  });
});
