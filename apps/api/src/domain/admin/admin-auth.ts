import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

import { sign } from 'hono/jwt';

export const ADMIN_TOKEN_TTL_SECONDS = 28800;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const DEFAULT_PARAMS = { N: 16384, r: 8, p: 1 };

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/** Formato `scrypt$<N>$<r>$<p>$<salt_base64>$<hash_base64>` (ADR-010). */
export async function hashPassword(
  password: string,
  params: { N: number; r: number; p: number } = DEFAULT_PARAMS,
): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, params);
  return `scrypt$${params.N}$${params.r}$${params.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, N, r, p, salt, hash] = stored.split('$');
    if (scheme !== 'scrypt' || !N || !r || !p || !salt || !hash) return false;
    const expected = Buffer.from(hash, 'base64');
    const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function signAdminToken(
  secret: string,
  now = Math.floor(Date.now() / 1000),
): Promise<{ token: string; expires_at: string }> {
  const exp = now + ADMIN_TOKEN_TTL_SECONDS;
  const token = await sign({ sub: 'admin', iat: now, exp }, secret, 'HS256');
  return { token, expires_at: new Date(exp * 1000).toISOString() };
}
