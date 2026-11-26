import { zValidator } from '@hono/zod-validator';
import type { Player } from '@nerdose/db';
import { getCookie } from 'hono/cookie';
import { createFactory } from 'hono/factory';

import { clientIp, limit } from '@/http/middleware/rate-limit';
import { playerSession } from '@/http/middleware/player-session';
import type { AppDeps, AppEnv } from '@/http/types';
import { validationHook } from '@/http/validation-hook';
import { isLocale } from '@/shared/locale';
import { playerRef } from '@/shared/player-ref';

import { preferencesUpdateSchema } from './identity.schema';
import { SESSION_COOKIE, issuePlayerCookie } from './session-cookie';

const factory = createFactory<AppEnv>();

const toPreferences = (p: Player) => ({
  locale: p.locale,
  preferred_code_language: p.preferredCodeLanguage,
});

export const createSession = (deps: AppDeps) =>
  factory.createHandlers(
    limit({ windowMs: 600_000, limit: 20, key: clientIp(deps.config) }),
    async (c) => {
      const { player, created } = await deps.identity.startSession({
        pid: getCookie(c, SESSION_COOKIE),
        acceptLanguage: c.req.header('accept-language'),
      });
      issuePlayerCookie(c, player.id);
      if (created) {
        if (!isLocale(c.req.query('lang'))) c.set('locale', player.locale);
        c.var.logger.info(
          { event: 'PlayerCreated', player_ref: playerRef(player.id), locale: player.locale },
          'Player created',
        );
      }
      return c.json({ ...toPreferences(player), created });
    },
  );

export const updatePreferences = (deps: AppDeps) =>
  factory.createHandlers(
    playerSession(deps.identity, 'required'),
    limit({ windowMs: 60_000, limit: 30, key: (c) => c.var.player!.id }),
    zValidator('json', preferencesUpdateSchema, validationHook),
    async (c) => {
      const body = c.req.valid('json');
      const player = await deps.identity.updatePreferences(c.var.player!.id, {
        locale: body.locale,
        preferredCodeLanguage: body.preferred_code_language,
      });
      c.var.logger.info(
        {
          event: 'PlayerPreferencesChanged',
          player_ref: playerRef(player.id),
          locale: player.locale,
          preferred_code_language: player.preferredCodeLanguage,
        },
        'Player preferences changed',
      );
      return c.json(toPreferences(player));
    },
  );
