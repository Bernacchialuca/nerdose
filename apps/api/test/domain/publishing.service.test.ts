import { describe, expect, it } from 'vitest';

import { PublishingService } from '@/domain/publishing/publishing.service';
import type { CachedChallenge } from '@/domain/publishing/publishing.types';
import { games } from '@/games/registry';
import { TodayCache } from '@/infra/cache/today-cache';

import { captureLogger } from '../helpers/logger';

const at = (iso: string) => ({ now: () => new Date(iso) });
const clockRef = (iso: string) => {
  let current = new Date(iso);
  return { now: () => current, set: (v: string) => (current = new Date(v)) };
};
const none = ['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt'].map((game_id) => ({
  game_id,
  challenge_status: 'none',
  play_status: null,
  history_label: null,
  current_streak: 0,
}));
const challenge = (game_id: CachedChallenge['game_id'], status: CachedChallenge['status']) =>
  ({ id: game_id, game_id, date: '2026-12-01', number: 8, status, payload: {} }) as CachedChallenge;

function build(opts: {
  clock: { now(): Date };
  rows?: CachedChallenge[];
  publishApproved?: (day: string) => Promise<never[]>;
  findTodayVisible?: (day: string) => Promise<CachedChallenge[]>;
  playsFail?: boolean;
}) {
  const calls = { publish: [] as string[], visible: [] as string[], terms: 0 };
  const cache = new TodayCache({
    findTodayVisible: async (day) => {
      calls.visible.push(day);
      return opts.findTodayVisible ? opts.findTodayVisible(day) : (opts.rows ?? []);
    },
  });
  const boom = () => {
    throw new Error('no debe consultarse');
  };
  const service = new PublishingService({
    repo: {
      publishApproved: async (day) => {
        calls.publish.push(day);
        return opts.publishApproved ? opts.publishApproved(day) : [];
      },
    },
    cache,
    wordList: { reload: async (repo) => void (await repo.findApprovedTerms()) },
    terms: {
      findApprovedTerms: async () => {
        calls.terms += 1;
        return [];
      },
    },
    clock: opts.clock,
    launchDate: '2026-11-24',
    logger: captureLogger().logger,
    games,
    gameplay: { findPlaysOfDay: opts.playsFail ? boom : async () => [] },
    progress: {
      todayStreaks: opts.playsFail
        ? boom
        : async () => ({ byGame: {}, global: { current: 0, max: 0 } }),
    },
  });
  return { service, calls, cache };
}

describe('PublishingService.ensureToday', () => {
  it('TS-3 single-flight: un solo UPDATE para requests concurrentes', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const { service, calls } = build({
      clock: at('2026-12-01T10:00:00Z'),
      publishApproved: async () => {
        await gate;
        return [];
      },
    });
    const all = Promise.all(Array.from({ length: 10 }, () => service.ensureToday()));
    release();
    await all;
    expect(calls.publish).toEqual(['2026-12-01']);
    expect(calls.visible).toEqual(['2026-12-01']);
    expect(calls.terms).toBe(1);

    // TS-4: mismo día, no repite.
    await service.ensureToday();
    await service.ensureToday();
    await service.ensureToday();
    expect(calls.publish).toHaveLength(1);
  });

  it('TS-5 cambio de día sin reiniciar', async () => {
    const clock = clockRef('2026-12-01T23:59:58Z');
    const { service, calls } = build({ clock });
    await service.ensureToday();
    clock.set('2026-12-02T00:00:05Z');
    await service.ensureToday();
    expect(calls.publish).toEqual(['2026-12-01', '2026-12-02']);
    expect(calls.visible).toEqual(['2026-12-01', '2026-12-02']);
  });

  it('si la publicación falla rechaza y reintenta en la siguiente llamada', async () => {
    let n = 0;
    const { service, calls } = build({
      clock: at('2026-12-01T10:00:00Z'),
      publishApproved: async () => {
        n += 1;
        if (n === 1) throw new Error('db down');
        return [];
      },
    });
    await expect(service.ensureToday()).rejects.toThrow('db down');
    await expect(service.ensureToday()).resolves.toBeUndefined();
    expect(calls.publish).toHaveLength(2);
  });

  it('un día nuevo espera la publicación en vuelo del día anterior y lanza la suya', async () => {
    const clock = clockRef('2026-12-01T23:59:59Z');
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const { service, calls } = build({
      clock,
      publishApproved: async (day) => {
        if (day === '2026-12-01') await gate;
        return [];
      },
    });
    const first = service.ensureToday();
    clock.set('2026-12-02T00:00:01Z');
    const second = service.ensureToday();
    release();
    await Promise.all([first, second]);
    expect(calls.publish).toEqual(['2026-12-01', '2026-12-02']);
  });

  it('loguea ChallengePublished por fila publicada', async () => {
    const cap = captureLogger();
    const service = new PublishingService({
      repo: {
        publishApproved: async () => [
          { id: 'x', game_id: 'devdle' as const, date: '2026-12-01', number: 8 },
        ],
      },
      cache: new TodayCache({ findTodayVisible: async () => [] }),
      wordList: { reload: async () => undefined },
      terms: { findApprovedTerms: async () => [] },
      clock: at('2026-12-01T10:00:00Z'),
      launchDate: '2026-11-24',
      logger: cap.logger,
      games,
      gameplay: { findPlaysOfDay: async () => [] },
      progress: { todayStreaks: async () => ({ byGame: {}, global: { current: 0, max: 0 } }) },
    });
    await service.ensureToday();
    expect(cap.lines()).toContainEqual(
      expect.objectContaining({
        level: 'info',
        event: 'ChallengePublished',
        challenge_id: 'x',
        game_id: 'devdle',
        date: '2026-12-01',
        number: 8,
      }),
    );
  });
});

describe('PublishingService.getToday', () => {
  const guest = { player: null, locale: 'es' as const };

  it('refleja la cache de juegos registrados; el resto queda en none', async () => {
    const { service, cache } = build({
      clock: at('2026-12-01T10:00:00Z'),
      rows: [challenge('devdle', 'published'), challenge('big-o', 'voided')],
    });
    await cache.reload('2026-12-01');
    const res = await service.getToday(guest);
    expect(res.games.map((g) => g.game_id)).toEqual([
      'devdle',
      'grep-grid',
      'timeline',
      'big-o',
      'bug-hunt',
    ]);
    // big-o no está registrado en el registry: none aunque la cache lo tenga.
    expect(res.games.map((g) => g.challenge_status)).toEqual([
      'published',
      'none',
      'none',
      'none',
      'none',
    ]);
  });

  it('valores del día con cache vacía', async () => {
    const { service } = build({ clock: at('2026-12-01T10:00:00Z') });
    expect(await service.getToday({ player: null, locale: 'es' })).toEqual({
      date: '2026-12-01',
      number: 8,
      next_reset_at: '2026-12-02T00:00:00Z',
      seconds_to_reset: 50400,
      has_session: false,
      global_streak: { current: 0, max: 0 },
      completed_today: 0,
      games: none,
    });
  });

  it('antes del lanzamiento number es null', async () => {
    const { service } = build({ clock: at('2026-11-23T12:00:00Z') });
    const r = await service.getToday(guest);
    expect(r.number).toBeNull();
    expect(r.date).toBe('2026-11-23');
  });

  it('último segundo del día', async () => {
    const { service } = build({ clock: at('2026-12-01T23:59:58Z') });
    const r = await service.getToday(guest);
    expect(r.seconds_to_reset).toBe(2);
    expect(r.next_reset_at).toBe('2026-12-02T00:00:00Z');
  });

  it('día del lanzamiento', async () => {
    const { service } = build({ clock: at('2026-11-24T00:00:00Z') });
    const r = await service.getToday(guest);
    expect(r.number).toBe(1);
    expect(r.seconds_to_reset).toBe(86400);
  });

  it('TS-51 antes del lanzamiento con desafío en cache informa none', async () => {
    const { service, cache } = build({
      clock: at('2026-11-20T10:00:00Z'),
      rows: [challenge('devdle', 'published')],
    });
    await cache.reload('2026-11-20');
    const r = await service.getToday(guest);
    expect(r.number).toBeNull();
    expect(r.games[0]!.challenge_status).toBe('none');
  });

  it('sin player no consulta plays ni rachas', async () => {
    const { service } = build({ clock: at('2026-12-01T10:00:00Z'), playsFail: true });
    await expect(service.getToday(guest)).resolves.toMatchObject({ has_session: false });
  });
});
