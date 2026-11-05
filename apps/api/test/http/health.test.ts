import { afterEach, describe, expect, inject, it } from 'vitest';

import { createDatabase } from '@/infra/database/db';
import { createHealthCheck } from '@/infra/database/health';

import { buildTestApp } from '../helpers/app';
import { freePort, silentServer } from '../helpers/net';

const opened: Array<{ end(options: { timeout: number }): Promise<void> }> = [];

function appFor(url: string, timeoutMs?: number) {
  const { sql } = createDatabase(url);
  opened.push(sql);
  return buildTestApp({ health: createHealthCheck({ sql, timeoutMs }) });
}

afterEach(async () => {
  await Promise.all(opened.splice(0).map((sql) => sql.end({ timeout: 0 })));
});

const OK = { status: 'ok', db: 'ok' };
const DEGRADED = { status: 'degraded', db: 'error' };

describe('GET /api/health y /api/admin/health', () => {
  it('health de jugador con base disponible', async () => {
    const { app } = appFor(inject('apiUrl'));
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/^application\/json/);
    expect(await res.json()).toEqual(OK);
  });

  it('health de admin sin autenticación', async () => {
    const { app } = appFor(inject('apiUrl'));
    const res = await app.request('/api/admin/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(OK);
  });

  it('con conexión rechazada responde 503 en menos de 3 s', async () => {
    const port = await freePort();
    const { app } = appFor(`postgres://nerdose_api:x@127.0.0.1:${port}/nerdose`);
    for (const path of ['/api/health', '/api/admin/health']) {
      const start = Date.now();
      const res = await app.request(path);
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual(DEGRADED);
      expect(Date.now() - start).toBeLessThan(3000);
    }
  });

  it('con base colgada responde 503 tras el timeout de 2 s', async () => {
    const server = await silentServer();
    try {
      const { app } = appFor(`postgres://nerdose_api:x@127.0.0.1:${server.port}/nerdose`, 2000);
      const start = Date.now();
      const res = await app.request('/api/health');
      const elapsed = Date.now() - start;
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual(DEGRADED);
      expect(elapsed).toBeGreaterThanOrEqual(1900);
      expect(elapsed).toBeLessThan(3000);
    } finally {
      await Promise.all(opened.splice(0).map((sql) => sql.end({ timeout: 0 })));
      await server.close();
    }
  });

  it('el fallo de la base va al log y no a la respuesta', async () => {
    const port = await freePort();
    const { app, lines } = appFor(`postgres://nerdose_api:x@127.0.0.1:${port}/nerdose`);
    const res = await app.request('/api/health');
    const text = await res.text();
    for (const leak of ['ECONNREFUSED', 'nerdose_api', '127.0.0.1', 'stack']) {
      expect(text).not.toContain(leak);
    }
    const warn = lines().find((line) => line.msg === 'Database health check failed');
    expect(warn).toMatchObject({ level: 'warn' });
    expect(warn?.err).toBeDefined();
    expect(String(warn?.requestId)).not.toBe('');
    expect(warn?.requestId).toBeTruthy();
  });

  it('emite cabeceras base y ningún CORS', async () => {
    const { app } = appFor(inject('apiUrl'));
    const res = await app.request('/api/health');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-request-id')).toBeTruthy();
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });
});
