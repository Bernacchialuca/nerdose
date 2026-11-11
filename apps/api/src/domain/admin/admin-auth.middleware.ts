import { AppError } from '@nerdose/core';
import type { MiddlewareHandler } from 'hono';
import { jwt } from 'hono/jwt';

import type { AppEnv } from '@/http/types';

/** JWT HS256 con `sub: "admin"` y `exp` obligatorio (ADR-010). */
export const adminAuth = (secret: string): MiddlewareHandler<AppEnv> => {
  const verify = jwt({ secret, alg: 'HS256' });
  return async (c, next) => {
    await verify(c, async () => undefined);
    const payload = c.get('jwtPayload') as { sub?: unknown; exp?: unknown } | undefined;
    if (payload?.sub !== 'admin' || typeof payload.exp !== 'number') {
      throw new AppError('unauthorized');
    }
    await next();
  };
};

/** Exige el JWT en todo `/api/admin/*` salvo las rutas listadas (método y path exactos). */
export const adminAuthExcept = (
  except: Array<{ method: string; path: string }>,
  secret: string,
): MiddlewareHandler<AppEnv> => {
  const auth = adminAuth(secret);
  return (c, next) =>
    except.some((e) => e.method === c.req.method && e.path === c.req.path) ? next() : auth(c, next);
};
