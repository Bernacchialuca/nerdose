import { GAME_IDS, challengeNumber, nextResetAt, secondsToReset, today } from '@nerdose/core';

import type { TodayCache } from '@/infra/cache/today-cache';
import type { Clock } from '@/shared/clock';

import type { Today } from './publishing.types';

export class PublishingService {
  constructor(
    private readonly deps: {
      cache: Pick<TodayCache, 'find'>;
      clock: Clock;
      launchDate: string;
    },
  ) {}

  getToday(input: { hasSession: boolean }): Today {
    const now = this.deps.clock.now();
    const date = today(now);
    return {
      date,
      number: challengeNumber(date, this.deps.launchDate),
      next_reset_at: nextResetAt(now).toISOString().replace('.000Z', 'Z'),
      seconds_to_reset: secondsToReset(now),
      has_session: input.hasSession,
      global_streak: { current: 0, max: 0 },
      completed_today: 0,
      games: GAME_IDS.map((game_id) => ({
        game_id,
        challenge_status: this.deps.cache.find(game_id)?.status ?? 'none',
        play_status: null,
        history_label: null,
        current_streak: 0,
      })),
    };
  }
}
