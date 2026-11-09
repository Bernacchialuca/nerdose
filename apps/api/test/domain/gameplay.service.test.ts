import { AppError } from '@nerdose/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { GameplayRepository, moveTransaction } from '@/domain/gameplay/gameplay.repository';
import { GameplayService } from '@/domain/gameplay/gameplay.service';
import { ProgressRepository } from '@/domain/progress/progress.repository';
import { ProgressService } from '@/domain/progress/progress.service';
import { PublishingRepository } from '@/domain/publishing/publishing.repository';
import { games } from '@/games/registry';
import { TodayCache } from '@/infra/cache/today-cache';
import { systemClock } from '@/shared/clock';

import { captureLogger } from '../helpers/logger';
import { PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const G_REACT = { guess: 'REACT', marks: ['present', 'correct', 'absent', 'absent', 'absent'] };
const G_MERGE = { guess: 'MERGE', marks: ['correct', 'correct', 'correct', 'correct', 'correct'] };

async function build() {
  const cache = new TodayCache(new PublishingRepository(dbs.api.db));
  await cache.reload('2026-12-01');
  return new GameplayService({
    games,
    cache,
    repo: new GameplayRepository(dbs.api.db),
    progress: new ProgressService({ repo: new ProgressRepository(dbs.api.db) }),
    runInTx: moveTransaction(dbs.api.db),
    wordList: { has: () => true },
    rejected: new GameplayRepository(dbs.api.db),
    clock: systemClock,
    launchDate: '2026-11-24',
  });
}
const publish = (extra: Record<string, unknown> = {}) =>
  dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    payload: PAYLOAD,
    status: 'published',
    ...extra,
  });
const countPlays = async () =>
  Number((await dbs.owner.sql`SELECT count(*)::int AS n FROM plays`)[0]!.n);

describe('GameplayService.start', () => {
  it('TS-27 crea la Play y loguea PlayStarted', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    const cap = captureLogger();
    const res = await (await build()).start('devdle', player, 8, cap.logger);
    expect(res).toEqual({
      play: { status: 'in_progress', state: { guesses: [] }, score: null, code_language: null },
    });
    const [row] = await dbs.owner.sql`SELECT * FROM plays`;
    expect(row).toMatchObject({
      player_id: player.id,
      challenge_id: challenge.id,
      game_id: 'devdle',
      status: 'in_progress',
    });
    expect(String(row!.date)).toContain('2026-12-01');
    expect(cap.lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
  });

  it('TS-28 y TS-29 es idempotente, también concurrente', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const cap = captureLogger();
    const service = await build();
    await service.start('devdle', player, 8, cap.logger);
    await service.start('devdle', player, 8, cap.logger);
    expect(await countPlays()).toBe(1);
    expect(cap.lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);

    const other = await dbs.insertPlayer();
    const [a, b] = await Promise.all([
      service.start('devdle', other, 8, cap.logger),
      service.start('devdle', other, 8, cap.logger),
    ]);
    expect(a.play.status).toBe('in_progress');
    expect(b.play.status).toBe('in_progress');
    expect(await countPlays()).toBe(2);
  });

  it('TS-30 con Play terminada devuelve la existente', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    const state = { guesses: [G_REACT, G_MERGE] };
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state,
      status: 'won',
      score: 2,
      result: games.get('devdle').result(PAYLOAD, state, 'es'),
      finishedAt: new Date('2026-12-01T09:30:00Z'),
    });
    const cap = captureLogger();
    const res = await (await build()).start('devdle', player, 8, cap.logger);
    expect(res.play).toEqual({ status: 'won', state, score: 2, code_language: null });
    expect(await countPlays()).toBe(1);
    expect(cap.lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(0);
  });

  it('TS-35 desafío anulado', async () => {
    await publish({
      status: 'voided',
      voidReason: 'wrong_answer',
      voidedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const player = await dbs.insertPlayer();
    await expect(
      (await build()).start('devdle', player, 8, captureLogger().logger),
    ).rejects.toMatchObject({ code: 'challenge_voided' });
    expect(await countPlays()).toBe(0);
  });

  it('TS-33 el número se valida antes que la cache; el registry antes que todo', async () => {
    const player = await dbs.insertPlayer();
    const service = await build();
    const log = captureLogger().logger;
    await expect(service.start('devdle', player, 7, log)).rejects.toMatchObject({
      code: 'challenge_expired',
    });
    await expect(service.start('devdle', player, 8, log)).rejects.toMatchObject({
      code: 'no_challenge_today',
    });
    await expect(service.start('grep-grid', player, 7, log)).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(service.start('devdle', player, 7, log)).rejects.toBeInstanceOf(AppError);
  });
});

describe('GameplayService.getToday', () => {
  it('TS-14 anulado: sin consultar plays', async () => {
    await publish({
      status: 'voided',
      voidReason: 'wrong_answer',
      voidedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const player = await dbs.insertPlayer();
    const res = await (await build()).getToday('devdle', player, 'es');
    expect(res).toEqual({
      game_id: 'devdle',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'voided',
      public_view: null,
      play: null,
      result: null,
      game_stats: null,
    });
  });

  it('TS-17 retoma la Play en curso', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [G_REACT] },
    });
    const res = await (await build()).getToday('devdle', player, 'es');
    expect(res.play).toEqual({
      status: 'in_progress',
      state: { guesses: [G_REACT] },
      score: null,
      code_language: null,
    });
    expect(res.result).toBeNull();
    expect(res.game_stats).toBeNull();
  });

  it('TS-19 y TS-23 Play ganada: resultado y game_stats', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    const state = { guesses: [G_REACT, G_MERGE] };
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state,
      status: 'won',
      score: 2,
      result: games.get('devdle').result(PAYLOAD, state, 'es'),
      finishedAt: new Date('2026-12-01T09:30:00Z'),
    });
    const res = await (await build()).getToday('devdle', player, 'en');
    expect(res.result).toMatchObject({
      win: true,
      score: 2,
      word: 'MERGE',
      definition: PAYLOAD.definition.en,
    });
    expect(res.game_stats).toMatchObject({ played: 0, win_rate: null });
  });

  it('TS-22 Play perdida', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    const guesses = ['REACT', 'CACHE', 'LINUX', 'PROXY', 'QUERY', 'SHELL'].map((guess) => ({
      guess,
      marks: ['absent', 'absent', 'absent', 'absent', 'absent'],
    }));
    const state = { guesses };
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state,
      status: 'lost',
      score: 6,
      result: games.get('devdle').result(PAYLOAD, state, 'es'),
      finishedAt: new Date('2026-12-01T09:30:00Z'),
    });
    const res = await (await build()).getToday('devdle', player, 'es');
    expect(res.play).toMatchObject({ status: 'lost', score: 6 });
    expect(res.result).toMatchObject({ win: false, score: 6, word: 'MERGE' });
  });

  it('sin player no llama a repo ni a progress', async () => {
    await publish();
    const cache = new TodayCache(new PublishingRepository(dbs.api.db));
    await cache.reload('2026-12-01');
    const boom = new Proxy(
      {},
      {
        get: () => () => {
          throw new Error('db');
        },
      },
    ) as never;
    const service = new GameplayService({
      games,
      cache,
      repo: boom,
      progress: boom,
      runInTx: boom,
      wordList: boom,
      rejected: boom,
      clock: systemClock,
      launchDate: '2026-11-24',
    });
    const res = await service.getToday('devdle', null, 'es');
    expect(res.challenge_status).toBe('published');
    expect(res.public_view).toEqual({ length: 5, possible_categories: expect.any(Array) });
    expect(res.play).toBeNull();
  });
});
