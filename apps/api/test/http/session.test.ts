import { players } from '@nerdose/db';
import { count, eq, gt } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { AppDeps } from '@/http/types';

import { MUTATION_HEADERS, TEST_CONFIG, buildTestApp } from '../helpers/app';
import { COOKIE_ATTRS, parseSetCookie, useDatabases } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

const dbs = useDatabases();

beforeAll(() => dbs.reset());
afterAll(() => dbs.close());

let ipCounter = 0;
const nextIp = () => `203.0.113.${++ipCounter}`;

function setup(config: AppDeps['config'] = TEST_CONFIG) {
  const captured = captureLogger();
  const { app } = buildTestApp({ identity: dbs.identity(), config, logger: captured.logger });
  const session = (headers: Record<string, string> = {}, ip = nextIp()) =>
    app.request('/api/session', {
      method: 'POST',
      headers: { ...MUTATION_HEADERS, 'X-Forwarded-For': ip, ...headers },
      body: '{}',
    });
  return { app, session, lines: captured.lines };
}

const playerCount = async () => (await dbs.owner.db.select({ n: count() }).from(players))[0]!.n;

describe('POST /api/session', () => {
  it('crea el primer Player con idioma inglés y emite la cookie', async () => {
    const { session } = setup();
    const res = await session({ 'Accept-Language': 'en-US,en;q=0.9' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      locale: 'en',
      preferred_code_language: 'js',
      created: true,
    });
    const cookie = parseSetCookie(res.headers.get('set-cookie'))!;
    expect(cookie.name).toBe('nd_pid');
    expect(cookie.attrs).toEqual(COOKIE_ATTRS);
    const [row] = await dbs.owner.db.select().from(players).where(eq(players.id, cookie.value!));
    expect(row).toMatchObject({ locale: 'en', preferredCodeLanguage: 'js', userId: null });
  });

  it.each([
    ['pt-BR', 'es'],
    [undefined, 'es'],
    ['fr-FR,en;q=0.8,es;q=0.5', 'en'],
  ])('Accept-Language %s da locale %s', async (al, expected) => {
    const { session } = setup();
    const res = await session(al ? { 'Accept-Language': al } : {});
    expect(await res.json()).toEqual({
      locale: expected,
      preferred_code_language: 'js',
      created: true,
    });
    const id = parseSetCookie(res.headers.get('set-cookie'))!.value!;
    const [saved] = await dbs.owner.db.select().from(players).where(eq(players.id, id));
    expect(saved!.locale).toBe(expected);
  });

  it('es idempotente con cookie válida', async () => {
    const p = await dbs.insertPlayer({
      locale: 'en',
      preferredCodeLanguage: 'go',
      lastSeenAt: new Date('2026-01-01T00:00:00Z'),
    });
    const { session } = setup();
    const before = new Date();
    const res = await session({ 'Accept-Language': 'es', Cookie: `nd_pid=${p.id}` });
    expect(await res.json()).toEqual({
      locale: 'en',
      preferred_code_language: 'go',
      created: false,
    });
    expect(parseSetCookie(res.headers.get('set-cookie'))).toMatchObject({
      value: p.id,
      attrs: COOKIE_ATTRS,
    });
    const [row] = await dbs.owner.db.select().from(players).where(eq(players.id, p.id));
    expect(row!.lastSeenAt.getTime()).toBeGreaterThan(new Date('2026-01-01').getTime());
    expect(row).toMatchObject({ locale: 'en', preferredCodeLanguage: 'go' });
    const fresh = await dbs.owner.db
      .select({ n: count() })
      .from(players)
      .where(gt(players.createdAt, before));
    expect(fresh[0]!.n).toBe(0);
  });

  it('trata una cookie huérfana como ausente', async () => {
    const orphan = '9b2f6c1e-3d4a-4f5b-8c7d-1e2f3a4b5c6d';
    const { session } = setup();
    const res = await session({ 'Accept-Language': 'en', Cookie: `nd_pid=${orphan}` });
    expect(await res.json()).toEqual({
      locale: 'en',
      preferred_code_language: 'js',
      created: true,
    });
    const cookie = parseSetCookie(res.headers.get('set-cookie'))!;
    expect(cookie.attrs).toEqual(COOKIE_ATTRS);
    expect(cookie.value).not.toBe(orphan);
    const [row] = await dbs.owner.db.select().from(players).where(eq(players.id, cookie.value!));
    expect(row).toBeDefined();
  });

  it('una cookie con formato inválido no genera errores', async () => {
    const { session, lines } = setup();
    const res = await session({ Cookie: 'nd_pid=no-es-un-uuid' });
    expect(res.status).toBe(200);
    expect((await res.json()).created).toBe(true);
    expect(parseSetCookie(res.headers.get('set-cookie'))).toMatchObject({
      name: 'nd_pid',
      attrs: COOKIE_ATTRS,
    });
    expect(lines().filter((l) => l.level === 'error')).toEqual([]);
  });

  it('loguea PlayerCreated sin PII', async () => {
    const { session, lines } = setup();
    const res = await session({ 'Accept-Language': 'en' }, '203.0.113.250');
    const id = parseSetCookie(res.headers.get('set-cookie'))!.value;
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'info',
        event: 'PlayerCreated',
        player_id: id,
        locale: 'en',
      }),
    );
    const text = JSON.stringify(lines());
    expect(text).not.toContain('203.0.113.250');
    expect(text.split(id!).length - 1).toBe(
      lines().filter((l) => JSON.stringify(l).includes(id!)).length,
    );
  });

  it('limita a 20 sesiones por IP y no crea el Player 21', async () => {
    const { session } = setup();
    const ip = '203.0.113.200';
    const before = await playerCount();
    for (let i = 0; i < 20; i++) expect((await session({}, ip)).status).toBe(200);
    const res = await session({}, ip);
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      error: { code: 'rate_limited', message: 'Demasiadas solicitudes.' },
    });
    expect(res.headers.get('retry-after')).toBe('600');
    expect(res.headers.get('set-cookie')).toBeNull();
    expect((await playerCount()) - before).toBe(20);
    expect((await session({}, '198.51.100.9')).status).toBe(200);
  });

  it('la clave es la primera IP de X-Forwarded-For', async () => {
    const { session } = setup();
    for (let i = 0; i < 20; i++) await session({}, '203.0.113.201, 10.0.0.1');
    expect((await session({}, '203.0.113.201, 10.0.0.2')).status).toBe(429);
  });

  it('sin TRUST_PROXY_HEADER todos comparten el balde', async () => {
    const { session } = setup({ ...TEST_CONFIG, TRUST_PROXY_HEADER: undefined });
    for (let i = 1; i <= 20; i++) await session({}, `192.0.2.${i}`);
    expect((await session({}, '192.0.2.99')).status).toBe(429);
  });

  it('rechaza origen inválido sin crear Player', async () => {
    const { app } = setup();
    const before = await playerCount();
    const res = await app.request('/api/session', {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
    const noOrigin = await app.request('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(noOrigin.status).toBe(403);
    expect(await playerCount()).toBe(before);
  });

  it('rechaza content-type inválido sin crear Player', async () => {
    const { app } = setup();
    const before = await playerCount();
    const wrong = await app.request('/api/session', {
      method: 'POST',
      headers: { Origin: 'http://localhost:5173', 'Content-Type': 'text/plain' },
      body: '{}',
    });
    expect(wrong.status).toBe(415);
    const none = await app.request('/api/session', {
      method: 'POST',
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(none.status).toBe(415);
    expect(await playerCount()).toBe(before);
  });

  it('acepta Content-Type con charset', async () => {
    const { session } = setup();
    const res = await session({ 'Content-Type': 'application/json; charset=utf-8' });
    expect(res.status).toBe(200);
    expect((await res.json()).created).toBe(true);
  });

  it('no emite CORS y sí cabeceras de seguridad', async () => {
    const { session } = setup();
    const res = await session();
    expect([...res.headers.keys()].some((k) => k.startsWith('access-control-'))).toBe(false);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('el error se devuelve en inglés según Accept-Language', async () => {
    const { app } = setup();
    const res = await app.request('/api/session', {
      method: 'POST',
      headers: {
        Origin: 'https://evil.example',
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US',
      },
      body: '{}',
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: { code: 'forbidden_origin', message: 'Origin not allowed.' },
    });
  });
});
