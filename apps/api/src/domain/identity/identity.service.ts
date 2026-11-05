import { AppError } from '@nerdose/core';
import type { CodeLanguage, Locale } from '@nerdose/core';
import type { Player } from '@nerdose/db';
import { z } from 'zod';

import { pickLocale } from '@/shared/locale';

import type { IdentityRepository } from './identity.repository';

const isUuid = (value: string | undefined): value is string =>
  value !== undefined && z.uuid().safeParse(value).success;

export class IdentityService {
  constructor(private readonly repo: IdentityRepository) {}

  async startSession(input: {
    pid: string | undefined;
    acceptLanguage: string | undefined;
  }): Promise<{ player: Player; created: boolean }> {
    if (isUuid(input.pid)) {
      const existing = await this.repo.touch(input.pid);
      if (existing) return { player: existing, created: false };
    }
    const player = await this.repo.create({
      locale: pickLocale(input.acceptLanguage),
      preferredCodeLanguage: 'js',
    });
    return { player, created: true };
  }

  async find(pid: string | undefined): Promise<Player | null> {
    if (!isUuid(pid)) return null;
    return this.repo.findById(pid);
  }

  async updatePreferences(
    playerId: string,
    patch: { locale?: Locale; preferredCodeLanguage?: CodeLanguage },
  ): Promise<Player> {
    const player = await this.repo.updatePreferences(playerId, patch);
    if (!player) throw new AppError('no_session');
    return player;
  }
}
