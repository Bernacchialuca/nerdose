import { AppError } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import {
  EmptyChallengesRepository,
  type ChallengesReadRepository,
} from '@/domain/publishing/publishing.repository';
import type { CachedChallenge } from '@/domain/publishing/publishing.types';
import { TodayCache } from '@/infra/cache/today-cache';

const clock = { now: () => new Date('2026-12-01T10:00:00Z') };

const fakeRepo = () => {
  const days: string[] = [];
  let fail = false;
  const repo: ChallengesReadRepository = {
    async findTodayVisible(day) {
      days.push(day);
      if (fail) throw new Error('db down');
      return [
        { game_id: 'devdle', status: 'published' },
        { game_id: 'big-o', status: 'voided' },
      ] satisfies CachedChallenge[];
    },
  };
  return { repo, days, breakIt: () => (fail = true) };
};

describe('EmptyChallengesRepository', () => {
  it('resuelve una lista vacía', async () => {
    await expect(new EmptyChallengesRepository().findTodayVisible()).resolves.toEqual([]);
  });
});

describe('TodayCache', () => {
  it('vacía: find devuelve undefined y get lanza no_challenge_today', async () => {
    const cache = new TodayCache(new EmptyChallengesRepository(), clock);
    await cache.reload();
    expect(cache.find('devdle')).toBeUndefined();
    try {
      cache.get('devdle');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe('no_challenge_today');
      expect((e as AppError).status).toBe(404);
    }
  });

  it('con desafíos: consulta el día UTC del reloj y los expone', async () => {
    const { repo, days } = fakeRepo();
    const cache = new TodayCache(repo, clock);
    await cache.reload();
    expect(days).toEqual(['2026-12-01']);
    expect(cache.find('devdle')).toEqual({ game_id: 'devdle', status: 'published' });
    expect(cache.find('big-o')?.status).toBe('voided');
    expect(cache.find('timeline')).toBeUndefined();
  });

  it('una recarga fallida rechaza y conserva el contenido', async () => {
    const { repo, breakIt } = fakeRepo();
    const cache = new TodayCache(repo, clock);
    await cache.reload();
    breakIt();
    await expect(cache.reload()).rejects.toThrow('db down');
    expect(cache.find('devdle')).toEqual({ game_id: 'devdle', status: 'published' });
  });
});
