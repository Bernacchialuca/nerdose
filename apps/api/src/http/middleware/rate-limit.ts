import { AppError } from '@nerdose/core';
import type { Context } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import { rateLimiter } from 'hono-rate-limiter';

import type { AppEnv } from '@/http/types';

export const limit = (opts: {
  windowMs: number;
  limit: number;
  key: (c: Context<AppEnv>) => string;
}) =>
  rateLimiter<AppEnv>({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: 'draft-6',
    keyGenerator: opts.key,
    handler: (c) => {
      c.header('Retry-After', String(Math.ceil(opts.windowMs / 1000)));
      throw new AppError('rate_limited');
    },
  });

export type ClientIpConfig = { TRUST_PROXY_HEADER?: string; TRUST_PROXY_HOPS?: number };

/** IP de la conexión TCP; `undefined` si no hay socket (p. ej. `app.request` en tests). */
function socketIp(c: Context): string | undefined {
  try {
    return getConnInfo(c).remote.address || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Clave del rate limit por IP.
 * - Sin header configurado: la IP de la conexión (sin proxy delante, es la del cliente).
 * - `X-Forwarded-For`: la entrada que agregó el proxy de confianza, contando `TRUST_PROXY_HOPS`
 *   desde la DERECHA. Las de la izquierda las escribe el cliente: tomar la primera dejaba
 *   saltear el límite mandando una IP inventada distinta en cada request.
 * - Otro header (`X-Real-IP`, `CF-Connecting-IP`, `Fly-Client-IP`…): su valor, que el proxy pisa.
 * Si el header falta (request que no pasó por el proxy), cae a la IP de la conexión.
 */
export const clientIp =
  ({ TRUST_PROXY_HEADER: header, TRUST_PROXY_HOPS: hops = 1 }: ClientIpConfig) =>
  (c: Context): string => {
    const raw = header ? c.req.header(header)?.trim() : undefined;
    if (raw) {
      if (header?.toLowerCase() !== 'x-forwarded-for') return raw;
      const entries = raw
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      const ip = entries[Math.max(0, entries.length - hops)];
      if (ip) return ip;
    }
    return socketIp(c) ?? 'unknown';
  };
