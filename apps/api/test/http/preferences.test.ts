import { randomUUID } from 'node:crypto';

import { players } from '@nerdose/db';
import { count, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { preferencesUpdateSchema } from '@/domain/identity/identity.schema';

import { playerRef } from '@/shared/player-ref';

import { MUTATION_HEADERS, buildTestApp } from '../helpers/app';
import { useDatabases } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

const dbs = useDatabases();

beforeAll(() => dbs.reset());
afterAll(() => dbs.close());

function setup() {
  const captured = captureLogger();
  const { app } = buildTestApp({ identity: dbs.identity(), logger: captured.logger });
  const patch = (
    body: unknown,
    opts: { cookie?: string; headers?: Record<string, string>; query?: string; raw?: boolean } = {},
  ) =>
    app.request(`/api/me/preferences${opts.query ?? ''}`, {
      method: 'PATCH',
      headers: {
        ...MUTATION_HEADERS,
        ...(opts.cookie ? { Cookie: `nd_pid=${opts.cookie}` } : {}),
        ...opts.headers,
      },
      body: opts.raw ? (body as string) : JSON.stringify(body),
    });
  return { app, patch, lines: captured.lines };
}

const row = async (id: string) =>
  (await dbs.owner.db.select().from(players).where(eq(players.id, id)))[0]!;

const VALIDATION = { error: { code: 'validation_error', message: 'Datos inválidos.' } };

describe('PATCH /api/me/preferences', () => {
  it.each([
    [
      { preferred_code_language: 'go' },
      'es',
      'js',
      { locale: 'es', preferred_code_language: 'go' },
    ],
    [{ locale: 'en' }, 'es', 'java', { locale: 'en', preferred_code_language: 'java' }],
    [
      { locale: 'es', preferred_code_language: 'java' },
      'en',
      'js',
      { locale: 'es', preferred_code_language: 'java' },
    ],
    [{ locale: 'es' }, 'es', 'js', { locale: 'es', preferred_code_language: 'js' }],
  ])('actualiza %j', async (body, locale, lang, expected) => {
    const p = await dbs.insertPlayer({
      locale: locale as 'es' | 'en',
      preferredCodeLanguage: lang as 'js' | 'java',
    });
    const { patch } = setup();
    const res = await patch(body, { cookie: p.id });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(expected);
    const saved = await row(p.id);
    expect({ locale: saved.locale, preferred_code_language: saved.preferredCodeLanguage }).toEqual(
      expected,
    );
  });

  it.each([
    [{ locale: 'fr' }],
    [{ preferred_code_language: 'rust' }],
    [{}],
    [{ theme: 'dark' }],
    [{ locale: 'en', preferred_code_language: 'rust' }],
    [{ locale: null }],
  ])('responde 422 con %j sin modificar el Player', async (body) => {
    const p = await dbs.insertPlayer({ locale: 'es', preferredCodeLanguage: 'js' });
    const { patch } = setup();
    const res = await patch(body, { cookie: p.id });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(VALIDATION);
    expect(await row(p.id)).toMatchObject({ locale: 'es', preferredCodeLanguage: 'js' });
  });

  it('responde 422 con JSON mal formado y sin log de error', async () => {
    const p = await dbs.insertPlayer();
    const { patch, lines } = setup();
    const res = await patch('{"locale":', { cookie: p.id, raw: true });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(VALIDATION);
    expect(lines().filter((l) => l.level === 'error')).toEqual([]);
  });

  it('responde 422 con un body mayor a 64 KiB', async () => {
    const p = await dbs.insertPlayer({ locale: 'es' });
    const { patch } = setup();
    const res = await patch({ locale: 'en', pad: 'x'.repeat(65_537) }, { cookie: p.id });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(VALIDATION);
    expect((await row(p.id)).locale).toBe('es');
  });

  it('rechaza un Origin no permitido', async () => {
    const p = await dbs.insertPlayer({ locale: 'es' });
    const { patch } = setup();
    const res = await patch(
      { locale: 'en' },
      { cookie: p.id, headers: { Origin: 'https://evil.example' } },
    );
    expect(res.status).toBe(403);
    expect((await row(p.id)).locale).toBe('es');
  });

  it.each([undefined, `${randomUUID()}`, 'xyz'])(
    'responde 401 no_session con cookie %s, incluso con body inválido',
    async (cookie) => {
      const before = (await dbs.owner.db.select({ n: count() }).from(players))[0]!.n;
      const { patch } = setup();
      const res = await patch({ locale: 'fr' }, { cookie });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({
        error: { code: 'no_session', message: 'No hay una sesión activa.' },
      });
      expect((await dbs.owner.db.select({ n: count() }).from(players))[0]!.n).toBe(before);
    },
  );

  it('limita a 30 por minuto por jugador', async () => {
    const [p9, p10] = [await dbs.insertPlayer(), await dbs.insertPlayer()];
    const { patch } = setup();
    for (let i = 0; i < 30; i++)
      expect((await patch({ locale: 'en' }, { cookie: p9.id })).status).toBe(200);
    const res = await patch({ locale: 'en' }, { cookie: p9.id });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('60');
    expect((await res.json()).error.code).toBe('rate_limited');
    expect((await patch({ locale: 'en' }, { cookie: p10.id })).status).toBe(200);
  });

  it('loguea PlayerPreferencesChanged', async () => {
    const p = await dbs.insertPlayer({ locale: 'es', preferredCodeLanguage: 'js' });
    const { patch, lines } = setup();
    await patch({ preferred_code_language: 'go' }, { cookie: p.id });
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'info',
        event: 'PlayerPreferencesChanged',
        player_ref: playerRef(p.id),
        locale: 'es',
        preferred_code_language: 'go',
      }),
    );
  });
});

describe('locale de los errores', () => {
  it('el locale del Player gana sobre Accept-Language', async () => {
    const p = await dbs.insertPlayer({ locale: 'en' });
    const { patch } = setup();
    const res = await patch(
      { locale: 'fr' },
      { cookie: p.id, headers: { 'Accept-Language': 'es' } },
    );
    expect((await res.json()).error.message).toBe('Invalid data.');
  });

  it('?lang gana sobre el Player', async () => {
    const p = await dbs.insertPlayer({ locale: 'en' });
    const { patch } = setup();
    const res = await patch(
      { locale: 'fr' },
      { cookie: p.id, headers: { 'Accept-Language': 'es' }, query: '?lang=es' },
    );
    expect((await res.json()).error.message).toBe('Datos inválidos.');
  });

  it('?lang sin cookie', async () => {
    const { patch } = setup();
    const res = await patch(
      { locale: 'en' },
      { query: '?lang=en', headers: { 'Accept-Language': 'es' } },
    );
    expect((await res.json()).error.message).toBe('No active session.');
  });

  it('?lang inválido se ignora', async () => {
    const { patch } = setup();
    const res = await patch(
      { locale: 'en' },
      { query: '?lang=fr', headers: { 'Accept-Language': 'en' } },
    );
    expect((await res.json()).error.message).toBe('No active session.');
  });

  it('el default es español', async () => {
    const { patch } = setup();
    const res = await patch({ locale: 'en' });
    expect((await res.json()).error.message).toBe('No hay una sesión activa.');
  });
});

describe('preferencesUpdateSchema', () => {
  it.each([
    [{ preferred_code_language: 'go' }, true],
    [{ locale: 'en' }, true],
    [{ locale: 'es', preferred_code_language: 'java' }, true],
    [{ locale: 'fr' }, false],
    [{ preferred_code_language: 'rust' }, false],
    [{}, false],
    [{ theme: 'dark' }, false],
    [{ locale: null }, false],
  ])('safeParse(%j) = %s', (body, ok) => {
    expect(preferencesUpdateSchema.safeParse(body).success).toBe(ok);
  });
});
