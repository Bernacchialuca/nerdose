import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { MyStatsService } from '@/domain/progress/my-stats.service';
import { ProgressRepository } from '@/domain/progress/progress.repository';
import { games } from '@/games/registry';

import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(() => dbs.reset());
afterAll(() => dbs.close());

const svc = (now = '2026-12-02T00:05:00Z') =>
  new MyStatsService({
    repo: new ProgressRepository(dbs.api.db),
    games,
    clock: { now: () => new Date(now) },
  });

describe('MyStatsService', () => {
  it('currentDay usa el reloj inyectado', () => {
    expect(svc().currentDay()).toBe('2026-12-02');
  });

  it('jugador sin filas: ceros y 5 juegos', async () => {
    const p = await dbs.insertPlayer();
    const r = await svc().myStats(p.id, '2026-12-02', 'es', null);
    expect(r.global).toEqual({ current_streak: 0, max_streak: 0, total_completed: 0 });
    expect(r.games.map((g) => g.game_id)).toEqual([
      'devdle',
      'grep-grid',
      'timeline',
      'big-o',
      'bug-hunt',
    ]);
    expect(r.history_next_before).toBeNull();
  });

  it('TS-11 paginación a nivel servicio sin repetir filas', async () => {
    const p = await dbs.insertPlayer();
    const ids = ['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt'] as const;
    const rows = [];
    for (let d = 30; d >= 17; d -= 1) {
      const date = `2026-12-${d}`;
      for (const gameId of d === 30 ? ids.slice(0, 2) : d === 17 ? ids.slice(0, 3) : ids) {
        const c = await dbs.insertChallenge({ gameId, date });
        rows.push({
          playerId: p.id,
          challengeId: c.id,
          gameId,
          date,
          state: {},
          status: 'lost' as const,
          result: { win: false, score: 0 },
          finishedAt: new Date(`${date}T12:00:00Z`),
        });
      }
    }
    await dbs.insertPlays(rows);
    const a = await svc().myStats(p.id, '2026-12-31', 'es', null);
    const b = await svc().myStats(p.id, '2026-12-31', 'es', a.history_next_before);
    const keys = [...a.history, ...b.history].map((h) => `${h.date}|${h.game_id}`);
    expect(a.history).toHaveLength(57);
    expect(a.history_next_before).toBe('2026-12-19');
    expect(b.history).toHaveLength(8);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toHaveLength(rows.length);
  });
});
