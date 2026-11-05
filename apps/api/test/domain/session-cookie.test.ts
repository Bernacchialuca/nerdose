import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { issuePlayerCookie } from '@/domain/identity/session-cookie';

import { COOKIE_ATTRS, parseSetCookie } from '../helpers/db';

describe('issuePlayerCookie', () => {
  it('emite nd_pid con los atributos exactos y sin Domain', async () => {
    const app = new Hono().get('/', (c) => {
      issuePlayerCookie(c, 'abc');
      return c.text('ok');
    });
    const cookie = parseSetCookie((await app.request('/')).headers.get('set-cookie'));
    expect(cookie).toMatchObject({ name: 'nd_pid', value: 'abc', attrs: COOKIE_ATTRS });
  });
});
