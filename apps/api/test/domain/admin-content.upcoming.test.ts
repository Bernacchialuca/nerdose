import { createGameRegistry } from '@nerdose/core';
import { devdle } from '@nerdose/game-devdle/definition';
import { describe, expect, it } from 'vitest';

import { AdminContentService } from '@/domain/admin/admin-content.service';
import { games } from '@/games/registry';

const clock = { now: () => new Date('2026-12-01T10:00:00Z') };
type Repo = ConstructorParameters<typeof AdminContentService>[0]['repo'];
const emptyRepo: Repo = {
  findActiveFailures: async () => [],
  findApprovedBetween: async () => [],
  findLatestRequests: async () => [],
  findRejectedBankItems: async () => [],
  countBank: async () => ({ approvedTotal: 0, rejectedTotal: 0, available: [], availableAll: 0 }),
  findRejections: async () => [],
  findLastSuccessfulSync: async () => null,
  topRejectedGuesses: async () => [],
};
const make = (repo: Partial<Repo> = {}, launchDate = '2026-11-24') =>
  new AdminContentService({ repo: { ...emptyRepo, ...repo }, games, clock, launchDate });

describe('AdminContentService.upcoming', () => {
  it('ventana, orden de games y celdas vacías', async () => {
    const r = await make().upcoming(2);
    expect(r.days.map((d) => d.date)).toEqual(['2026-12-02', '2026-12-03']);
    expect(r.days[0]!.games).toEqual([
      { game_id: 'devdle', challenge: null, regeneration: null, failure: null },
      { game_id: 'grep-grid', challenge: null, regeneration: null, failure: null },
      { game_id: 'timeline', challenge: null, regeneration: null, failure: null },
    ]);
  });

  it('omite las fechas anteriores al lanzamiento', async () => {
    const r = await make({}, '2026-12-03').upcoming(3);
    expect(r.days.map((d) => d.date)).toEqual(['2026-12-03', '2026-12-04']);
    expect(r.days[0]!.number).toBe(1);
  });

  it('failure solo sin challenge, active_failures fijo con days = 3 y regeneration filtrada', async () => {
    const row = {
      id: 'c1',
      gameId: 'devdle' as const,
      date: '2026-12-02',
      payload: {},
      verification: {},
      generatorVersion: 'v',
      attempt: 1,
    };
    const f = (gameId: 'devdle' | 'timeline', date: string) => ({
      gameId,
      date,
      attempts: 2,
      lastReason: null,
      updatedAt: new Date('2026-12-01T00:00:00Z'),
    });
    const req = (status: 'pending' | 'done') => ({
      id: 'r1',
      challengeId: 'c1',
      status,
      error: null,
      requestedAt: new Date('2026-12-01T09:00:00Z'),
      processedAt: null,
    });
    const svc = (status: 'pending' | 'done') =>
      make({
        findApprovedBetween: async () => [row],
        findActiveFailures: async () => [f('devdle', '2026-12-02'), f('timeline', '2026-12-10')],
        findLatestRequests: async () => [req(status)],
      });
    const a = await svc('pending').upcoming(3);
    expect(a.active_failures).toBe(2);
    expect(a.days[0]!.games[0]).toMatchObject({
      failure: null,
      regeneration: { status: 'pending' },
    });
    expect((await svc('done').upcoming(3)).days[0]!.games[0]!.regeneration).toBeNull();
    const b = await make({
      findActiveFailures: async () => [f('timeline', '2026-12-03')],
    }).upcoming(3);
    expect(b.days[1]!.games[2]!.failure).toMatchObject({ attempts: 2, last_reason: null });
  });
});

describe('AdminContentService constructor', () => {
  it('TS-37 un bankUsage desconocido falla al construir', () => {
    const bad = createGameRegistry([
      {
        ...devdle,
        bankUsage: {
          bank: 'terms',
          lastUsedField: 'last_used_xyz',
          windowDays: 1,
          itemsPerChallenge: 1,
        },
      },
    ]);
    expect(
      () =>
        new AdminContentService({ repo: emptyRepo, games: bad, clock, launchDate: '2026-11-24' }),
    ).toThrow('Unknown bank usage: terms.last_used_xyz');
  });
});
