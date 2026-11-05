import { createMiddleware } from 'hono/factory';

import type { AppEnv } from '@/http/types';
import { resolveLocale } from '@/shared/locale';

export const locale = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    c.set(
      'locale',
      resolveLocale({
        lang: c.req.query('lang'),
        acceptLanguage: c.req.header('accept-language'),
      }),
    );
    await next();
  });
