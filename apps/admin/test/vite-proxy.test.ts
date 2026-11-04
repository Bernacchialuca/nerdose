// @vitest-environment node
import { createServer as createHttpServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import viteConfig from '../vite.config';

type Reply = { status: number; body: unknown };

const received: string[] = [];
let reply: Reply = { status: 200, body: {} };
let stub: Server;
let vite: ViteDevServer;
let viteUrl: string;

const handler = (req: IncomingMessage, res: ServerResponse) => {
  received.push(`${req.method ?? ''} ${req.url ?? ''}`);
  res.writeHead(reply.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(reply.body));
};

beforeAll(async () => {
  stub = createHttpServer(handler);
  await new Promise<void>((resolve) => stub.listen(0, '127.0.0.1', resolve));
  const stubUrl = `http://127.0.0.1:${String((stub.address() as AddressInfo).port)}`;

  const rules = viteConfig.server?.proxy ?? {};
  const proxy = Object.fromEntries(
    Object.entries(rules).map(([key, raw]) => {
      const rule = typeof raw === 'string' ? { target: raw } : raw;
      return [key, { ...rule, target: stubUrl }];
    }),
  );

  vite = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0, strictPort: false, proxy },
  });
  await vite.listen();
  viteUrl = `http://127.0.0.1:${String((vite.httpServer?.address() as AddressInfo).port)}`;
});

afterAll(async () => {
  await vite.close();
  await new Promise<void>((resolve) => stub.close(() => resolve()));
});

beforeEach(() => {
  received.length = 0;
});

describe('proxy de mismo origen (admin)', () => {
  it('reenvía /api/admin/health sin cambiar el path (200)', async () => {
    reply = { status: 200, body: { status: 'ok', db: 'ok' } };
    const res = await fetch(`${viteUrl}/api/admin/health`);
    expect(received).toEqual(['GET /api/admin/health']);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('deja pasar el 503 de la api', async () => {
    reply = { status: 503, body: { status: 'degraded', db: 'error' } };
    const res = await fetch(`${viteUrl}/api/admin/health`);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'degraded', db: 'error' });
    expect(received).toEqual(['GET /api/admin/health']);
  });

  it('cubre todo /api/admin/* sin reescritura', async () => {
    const body = { error: { code: 'unauthorized', message: 'Sesión inválida' } };
    reply = { status: 401, body };
    const res = await fetch(`${viteUrl}/api/admin/reports?status=open`);
    expect(received).toEqual(['GET /api/admin/reports?status=open']);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual(body);
  });

  it('/api/health no llega a la api', async () => {
    reply = { status: 200, body: { status: 'ok', db: 'ok' } };
    const res = await fetch(`${viteUrl}/api/health`);
    expect(received).toEqual([]);
    expect(res.headers.get('content-type') ?? '').not.toContain('application/json');
  });

  it('otras rutas /api/* tampoco llegan a la api', async () => {
    const res = await fetch(`${viteUrl}/api/games/devdle/today`);
    expect(received).toEqual([]);
    expect(res.headers.get('content-type') ?? '').not.toContain('application/json');
  });

  it('las rutas de la SPA las sirve Vite', async () => {
    const res = await fetch(`${viteUrl}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('<div id="root">');
    expect(received).toEqual([]);
  });
});
