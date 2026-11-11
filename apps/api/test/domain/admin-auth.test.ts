import { verify } from 'hono/jwt';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { hashPassword, signAdminToken, verifyPassword } from '@/domain/admin/admin-auth';

describe('admin-auth', () => {
  afterEach(() => vi.useRealTimers());

  // TS-41
  it('verifyPassword acepta la contraseña, rechaza otra y un formato roto sin lanzar', async () => {
    const stored = await hashPassword('a');
    expect(stored).toMatch(/^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(await verifyPassword('a', stored)).toBe(true);
    expect(await verifyPassword('b', stored)).toBe(false);
    expect(await verifyPassword('a', 'scrypt$1$2')).toBe(false);
    expect(await verifyPassword('a', 'plain')).toBe(false);
  });

  it('salt de 16 bytes y hash de 64 bytes; dos hashes de la misma contraseña difieren', async () => {
    const [h1, h2] = [await hashPassword('x'), await hashPassword('x')];
    expect(h1).not.toBe(h2);
    const [, , , , salt, hash] = h1.split('$');
    expect(Buffer.from(salt!, 'base64')).toHaveLength(16);
    expect(Buffer.from(hash!, 'base64')).toHaveLength(64);
    expect(await verifyPassword('x', h1)).toBe(true);
    expect(await verifyPassword('x', h2)).toBe(true);
  });

  it('verifyPassword lee N/r/p del string guardado', async () => {
    const stored = await hashPassword('p', { N: 1024, r: 8, p: 1 });
    expect(stored.startsWith('scrypt$1024$8$1$')).toBe(true);
    expect(await verifyPassword('p', stored)).toBe(true);
  });

  it('signAdminToken firma HS256 con exactamente sub, iat y exp = iat + 28800', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T12:00:00Z'));
    const secret = 'a'.repeat(32);
    const { token, expires_at } = await signAdminToken(secret, 1796126400);
    const payload = await verify(token, secret, 'HS256');
    expect(payload).toEqual({ sub: 'admin', iat: 1796126400, exp: 1796155200 });
    expect(Object.keys(payload)).toEqual(['sub', 'iat', 'exp']);
    expect(expires_at).toBe('2026-12-01T20:00:00.000Z');
  });
});
