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

  const rawRule = viteConfig.server?.proxy?.['/api'];
  const rule = typeof rawRule === 'string' ? { target: rawRule } : rawRule;

  vite = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    logLevel: 'silent',
    server: {
      host: '127.0.0.1',
      port: 0,
      strictPort: false,
      proxy: { '/api': { ...rule, target: stubUrl } },
    },
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

describe('proxy de mismo origen', () => {
  it('reenvía /api/health sin cambiar el path (200)', async () => {
    reply = { status: 200, body: { status: 'ok', db: 'ok' } };
    const res = await fetch(`${viteUrl}/api/health`);
    expect(received).toEqual(['GET /api/health']);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('deja pasar el 503 de la api', async () => {
    reply = { status: 503, body: { status: 'degraded', db: 'error' } };
    const res = await fetch(`${viteUrl}/api/health`);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'degraded', db: 'error' });
    expect(received).toEqual(['GET /api/health']);
  });

  it('cubre todo /api/* sin reescritura', async () => {
    const body = { error: { code: 'not_found', message: 'Recurso inexistente' } };
    reply = { status: 404, body };
    const res = await fetch(`${viteUrl}/api/games/devdle/today`);
    expect(received).toEqual(['GET /api/games/devdle/today']);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(body);
  });

  it('no reenvía rutas que no son /api', async () => {
    const res = await fetch(`${viteUrl}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('<div id="root">');
    expect(received).toEqual([]);
  });
});
