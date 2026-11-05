import { describe, expect, it } from 'vitest';

import { PublishingService } from '@/domain/publishing/publishing.service';
import type { CachedChallenge } from '@/domain/publishing/publishing.types';
import { TodayCache } from '@/infra/cache/today-cache';
import { EmptyChallengesRepository } from '@/domain/publishing/publishing.repository';

const at = (iso: string) => ({ now: () => new Date(iso) });
const none = ['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt'].map((game_id) => ({
  game_id,
  challenge_status: 'none',
  play_status: null,
  history_label: null,
  current_streak: 0,
}));
const emptyService = (iso: string) =>
  new PublishingService({
    cache: new TodayCache(new EmptyChallengesRepository(), at(iso)),
    clock: at(iso),
    launchDate: '2026-11-24',
  });

describe('PublishingService.getToday', () => {
  it('refleja la cache en el orden de GAME_IDS', async () => {
    const clock = at('2026-12-01T10:00:00Z');
    const cache = new TodayCache(
      {
        findTodayVisible: async () =>
          [
            { game_id: 'devdle', status: 'published' },
            { game_id: 'big-o', status: 'voided' },
          ] satisfies CachedChallenge[],
      },
      clock,
    );
    await cache.reload();
    const res = new PublishingService({ cache, clock, launchDate: '2026-11-24' }).getToday({
      hasSession: false,
    });
    expect(res.games.map((g) => g.game_id)).toEqual([
      'devdle',
      'grep-grid',
      'timeline',
      'big-o',
      'bug-hunt',
    ]);
    expect(res.games.map((g) => g.challenge_status)).toEqual([
      'published',
      'none',
      'none',
      'voided',
      'none',
    ]);
    expect(res.games.every((g) => g.play_status === null && g.current_streak === 0)).toBe(true);
  });

  it('valores del día con cache vacía', () => {
    expect(emptyService('2026-12-01T10:00:00Z').getToday({ hasSession: true })).toEqual({
      date: '2026-12-01',
      number: 8,
      next_reset_at: '2026-12-02T00:00:00Z',
      seconds_to_reset: 50400,
      has_session: true,
      global_streak: { current: 0, max: 0 },
      completed_today: 0,
      games: none,
    });
  });

  it('antes del lanzamiento number es null', () => {
    const r = emptyService('2026-11-23T12:00:00Z').getToday({ hasSession: true });
    expect(r.number).toBeNull();
    expect(r.date).toBe('2026-11-23');
  });

  it('último segundo del día', () => {
    const r = emptyService('2026-12-01T23:59:58Z').getToday({ hasSession: false });
    expect(r.seconds_to_reset).toBe(2);
    expect(r.next_reset_at).toBe('2026-12-02T00:00:00Z');
  });

  it('día del lanzamiento', () => {
    const r = emptyService('2026-11-24T00:00:00Z').getToday({ hasSession: false });
    expect(r.number).toBe(1);
    expect(r.seconds_to_reset).toBe(86400);
  });
});
