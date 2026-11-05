import { AppError } from '@nerdose/core';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

import { SESSION_COOKIE } from '@/domain/identity/session-cookie';
import type { IdentityService } from '@/domain/identity/identity.service';
import type { AppEnv } from '@/http/types';
import { resolveLocale } from '@/shared/locale';

export const playerSession = (identity: IdentityService, mode: 'required' | 'optional') =>
  createMiddleware<AppEnv>(async (c, next) => {
    const player = await identity.find(getCookie(c, SESSION_COOKIE));
    c.set('player', player);
    if (player) {
      c.set(
        'locale',
        resolveLocale({
          lang: c.req.query('lang'),
          playerLocale: player.locale,
          acceptLanguage: c.req.header('accept-language'),
        }),
      );
      c.set('logger', c.var.logger.child({ playerId: player.id }));
    } else if (mode === 'required') {
      throw new AppError('no_session');
    }
    await next();
  });
