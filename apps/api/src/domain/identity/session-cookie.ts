import type { Context } from 'hono';
import { setCookie } from 'hono/cookie';

export const SESSION_COOKIE = 'nd_pid';
export const COOKIE_MAX_AGE = 34_560_000;

export function issuePlayerCookie(c: Context, playerId: string) {
  setCookie(c, SESSION_COOKIE, playerId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}
