import { describe, expect, it } from 'vitest';

import { MUTATION_HEADERS, buildTestApp } from '../helpers/app';

const post = (app: ReturnType<typeof buildTestApp>['app'], path: string, headers: HeadersInit) =>
  app.request(path, { method: 'POST', headers, body: '{}' });

describe('originAndContentType', () => {
  const { app } = buildTestApp();

  it('rechaza un Origin no permitido con 403', async () => {
    const res = await post(app, '/api/no-existe', {
      Origin: 'https://evil.example',
      'Content-Type': 'application/json',
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: { code: 'forbidden_origin', message: 'Origen no permitido.' },
    });
  });

  it('rechaza sin Origin con 403', async () => {
    const res = await post(app, '/api/no-existe', { 'Content-Type': 'application/json' });
    expect(res.status).toBe(403);
  });

  it('rechaza un Content-Type incorrecto con 415', async () => {
    const res = await post(app, '/api/no-existe', {
      Origin: 'http://localhost:5173',
      'Content-Type': 'text/plain',
    });
    expect(res.status).toBe(415);
    expect(await res.json()).toEqual({
      error: { code: 'unsupported_media_type', message: 'Tipo de contenido no soportado.' },
    });
  });

  it('rechaza sin Content-Type con 415', async () => {
    const res = await app.request('/api/no-existe', {
      method: 'POST',
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(res.status).toBe(415);
  });

  it('chequea primero el origen', async () => {
    const res = await post(app, '/api/no-existe', {
      Origin: 'https://evil.example',
      'Content-Type': 'text/plain',
    });
    expect(res.status).toBe(403);
  });

  it('admin exige ADMIN_ORIGIN y jugador exige WEB_ORIGIN', async () => {
    const web = await post(app, '/api/admin/no-existe', MUTATION_HEADERS);
    expect(web.status).toBe(403);
    const admin = await post(app, '/api/admin/no-existe', {
      Origin: 'http://localhost:5174',
      'Content-Type': 'application/json',
    });
    // Una ruta de admin inexistente sin token responde 401 (CA-3), no 404.
    expect(admin.status).toBe(401);
    expect(await admin.json()).toEqual({
      error: { code: 'unauthorized', message: 'No autorizado.' },
    });
    const adminOnPlayer = await post(app, '/api/no-existe', {
      Origin: 'http://localhost:5174',
      'Content-Type': 'application/json',
    });
    expect(adminOnPlayer.status).toBe(403);
  });

  it('acepta application/json con charset', async () => {
    const res = await post(app, '/api/no-existe', {
      Origin: 'http://localhost:5173',
      'Content-Type': 'application/json; charset=utf-8',
    });
    expect(res.status).toBe(404);
  });

  it('no chequea los GET', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('no emite CORS y sí cabeceras de seguridad', async () => {
    const res = await post(app, '/api/no-existe', MUTATION_HEADERS);
    expect([...res.headers.keys()].some((k) => k.startsWith('access-control-'))).toBe(false);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
