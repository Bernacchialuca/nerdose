import { randomUUID } from 'node:crypto';

import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createErrorHandler } from '@/http/middleware/error-handler';
import { locale } from '@/http/middleware/locale';
import { playerSession } from '@/http/middleware/player-session';
import type { AppEnv } from '@/http/types';

import { useDatabases } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

const dbs = useDatabases();

beforeAll(() => dbs.reset());
afterAll(() => dbs.close());

function probe(mode: 'required' | 'optional') {
  const { logger } = captureLogger();
  const app = new Hono<AppEnv>();
  app.use(async (c, next) => {
    c.set('logger', logger);
    await next();
  });
  app.use(locale());
  app.onError(createErrorHandler(logger));
  app.get('/probe', playerSession(dbs.identity(), mode), (c) =>
    c.json({ has_player: c.var.player !== null, locale: c.var.locale }),
  );
  return app;
}

describe('playerSession optional', () => {
  it('nunca lanza y expone el player', async () => {
    const app = probe('optional');
    const p = await dbs.insertPlayer({ locale: 'en' });
    const none = await app.request('/probe');
    expect(await none.json()).toMatchObject({ has_player: false });
    const ok = await app.request('/probe', { headers: { Cookie: `nd_pid=${p.id}` } });
    expect(await ok.json()).toEqual({ has_player: true, locale: 'en' });
    const bad = await app.request('/probe', { headers: { Cookie: 'nd_pid=xyz' } });
    expect(await bad.json()).toMatchObject({ has_player: false });
  });
});

describe('playerSession required', () => {
  it.each([undefined, 'nd_pid=xyz', `nd_pid=${randomUUID()}`])(
    'responde 401 no_session con cookie %s',
    async (cookie) => {
      const res = await probe('required').request('/probe', {
        headers: cookie ? { Cookie: cookie } : {},
      });
      expect(res.status).toBe(401);
      expect((await res.json()).error.code).toBe('no_session');
    },
  );

  it('?lang gana sobre el locale del player', async () => {
    const p = await dbs.insertPlayer({ locale: 'en' });
    const res = await probe('required').request('/probe?lang=es', {
      headers: { Cookie: `nd_pid=${p.id}`, 'Accept-Language': 'en' },
    });
    expect((await res.json()).locale).toBe('es');
  });
});
