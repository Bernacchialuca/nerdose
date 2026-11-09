import { AppError } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import type { ChallengesReadRepository } from '@/domain/publishing/publishing.repository';
import type { CachedChallenge } from '@/domain/publishing/publishing.types';
import { TodayCache } from '@/infra/cache/today-cache';

const devdle: CachedChallenge = {
  id: 'c1',
  game_id: 'devdle',
  date: '2026-12-01',
  number: 8,
  status: 'published',
  payload: {},
};
const bigO: CachedChallenge = { ...devdle, id: 'c2', game_id: 'big-o', status: 'voided' };

const fakeRepo = (rows: CachedChallenge[] = [devdle, bigO]) => {
  const days: string[] = [];
  let fail = false;
  const repo: ChallengesReadRepository = {
    async findTodayVisible(day) {
      days.push(day);
      if (fail) throw new Error('db down');
      return rows;
    },
  };
  return { repo, days, breakIt: () => (fail = true) };
};

describe('TodayCache', () => {
  it('vacía: find devuelve undefined y get lanza no_challenge_today', async () => {
    const cache = new TodayCache(fakeRepo([]).repo);
    await cache.reload('2026-12-01');
    expect(cache.find('devdle')).toBeUndefined();
    try {
      cache.get('devdle');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect(e).toMatchObject({ code: 'no_challenge_today', status: 404 });
    }
  });

  it('con desafíos: consulta el día pedido y los expone', async () => {
    const { repo, days } = fakeRepo();
    const cache = new TodayCache(repo);
    await cache.reload('2026-12-01');
    expect(days).toEqual(['2026-12-01']);
    expect(cache.find('devdle')).toEqual(devdle);
    expect(cache.get('devdle')).toEqual(devdle);
    expect(cache.find('big-o')?.status).toBe('voided');
    expect(cache.find('timeline')).toBeUndefined();
  });

  it('TS-7 una recarga fallida rechaza y conserva el contenido', async () => {
    const { repo, breakIt } = fakeRepo();
    const cache = new TodayCache(repo);
    await cache.reload('2026-12-01');
    breakIt();
    await expect(cache.reload('2026-12-02')).rejects.toThrow('db down');
    expect(cache.find('devdle')).toEqual(devdle);
  });
});
