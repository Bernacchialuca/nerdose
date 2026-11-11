import { rngFrom, type AnyGameDefinition, type GameId } from '@nerdose/core';
import { devdle, scoreGuess } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { timeline } from '@nerdose/game-timeline/definition';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ProgressRepository } from '@/domain/progress/progress.repository';
import { ProgressService } from '@/domain/progress/progress.service';
import type { ProgressRecomputeRepo } from '@/domain/progress/progress.types';

import { PAYLOAD, useDatabases } from '../helpers/db';
import { found, GG_PAYLOAD, SEVEN } from '../helpers/grep-grid';
import { CORRECT, ROTATED, TL_PAYLOAD } from '../helpers/timeline';

describe('ProgressService.recompute (unidad)', () => {
  it('bloquea por player_id asc (game_stats → player_stats), deduplica y calcula a mano', async () => {
    const calls: string[] = [];
    const saved: Array<Record<string, unknown>> = [];
    const savedPlayers: Array<Record<string, unknown>> = [];
    const repo: ProgressRecomputeRepo = {
      lockGameStats: async (p) => {
        calls.push(`gs(${p})`);
        return undefined as never;
      },
      lockPlayerStats: async (p) => {
        calls.push(`ps(${p})`);
        return undefined as never;
      },
      // 11-30 neutro (sin challenge); 12-01 voided cuenta como activo.
      activeDays: async () => [
        { gameId: 'devdle', date: '2026-11-29' },
        { gameId: 'devdle', date: '2026-12-01' },
      ],
      completedPlays: async (ids) => {
        expect(ids).toEqual(['p1', 'p2']);
        const won = devdle.result(
          PAYLOAD as never,
          { guesses: [{ guess: 'MERGE', marks: scoreGuess('MERGE', 'MERGE') }] } as never,
          'es',
        );
        return [
          { playerId: 'p1', gameId: 'devdle', date: '2026-11-29', status: 'won', result: won },
          { playerId: 'p1', gameId: 'devdle', date: '2026-12-01', status: 'voided', result: won },
        ];
      },
      saveGameStats: async (row) => {
        saved.push(row);
      },
      savePlayerStats: async (row) => {
        savedPlayers.push(row);
      },
    };
    const service = new ProgressService({ repo: {} as never });
    const out = await service.recompute(repo, { playerIds: ['p2', 'p1', 'p2'], game: devdle });
    expect(out).toEqual({ players: 2 });
    expect(calls).toEqual(['gs(p1)', 'ps(p1)', 'gs(p2)', 'ps(p2)']);
    expect(saved[0]).toMatchObject({
      playerId: 'p1',
      currentStreak: 2,
      maxStreak: 2,
      played: 1,
      wins: 1,
      lastCompletedDate: '2026-12-01',
    });
    expect(savedPlayers[0]).toMatchObject({
      globalStreak: 2,
      maxGlobalStreak: 2,
      lastActiveDate: '2026-12-01',
      totalCompleted: 2,
    });
    // Sin Play completadas: todo en cero.
    expect(saved[1]).toMatchObject({
      playerId: 'p2',
      currentStreak: 0,
      maxStreak: 0,
      played: 0,
      wins: 0,
      lastCompletedDate: null,
    });
    expect(savedPlayers[1]).toMatchObject({ totalCompleted: 0, lastActiveDate: null });
  });

  it('una Play won/lost sin result lanza', async () => {
    const repo = {
      lockGameStats: async () => undefined as never,
      lockPlayerStats: async () => undefined as never,
      activeDays: async () => [],
      completedPlays: async () => [
        {
          playerId: 'p1',
          gameId: 'devdle' as GameId,
          date: '2026-12-01',
          status: 'won' as const,
          result: null,
        },
      ],
      saveGameStats: async () => undefined,
      savePlayerStats: async () => undefined,
    };
    const service = new ProgressService({ repo: {} as never });
    await expect(service.recompute(repo, { playerIds: ['p1'], game: devdle })).rejects.toThrow(
      'without result',
    );
  });
});

const dbs = useDatabases();
beforeAll(() => dbs.reset());
afterAll(() => dbs.close());

type Entry = { game: AnyGameDefinition; payload: unknown; won: unknown; lost: unknown };
const GAMES: Entry[] = [
  {
    game: devdle,
    payload: PAYLOAD,
    won: devdle.result(
      PAYLOAD as never,
      { guesses: [{ guess: 'MERGE', marks: scoreGuess('MERGE', 'MERGE') }] } as never,
      'es',
    ),
    lost: devdle.result(
      PAYLOAD as never,
      {
        guesses: ['REACT', 'CACHE', 'LINUX', 'PROXY', 'QUERY', 'SHELL'].map((w) => ({
          guess: w,
          marks: scoreGuess('MERGE', w),
        })),
      } as never,
      'es',
    ),
  },
  {
    game: grepGrid,
    payload: GG_PAYLOAD,
    won: grepGrid.result(GG_PAYLOAD, found(...SEVEN, 'PYTHON'), 'es'),
    lost: grepGrid.result(GG_PAYLOAD, found('PYTHON'), 'es'),
  },
  {
    game: timeline,
    payload: TL_PAYLOAD,
    won: timeline.result(TL_PAYLOAD, { order: [...CORRECT] }, 'es'),
    lost: timeline.result(TL_PAYLOAD, { order: [...ROTATED] }, 'es'),
  },
];

describe('ProgressService.recompute (integración)', () => {
  // TS-27
  it('TS-27 el recálculo coincide con la aplicación incremental (historias aleatorias)', async () => {
    for (const seedByte of [1, 2, 3]) {
      await dbs.reset();
      const gen = rngFrom(new Uint8Array(16).fill(seedByte));
      const rng = { next: () => gen.int(0, 999) / 1000 };
      const players = await Promise.all([
        dbs.insertPlayer(),
        dbs.insertPlayer(),
        dbs.insertPlayer(),
      ]);
      const days = Array.from({ length: 40 }, (_, i) => {
        const d = new Date(Date.UTC(2026, 9, 20 + i));
        return d.toISOString().slice(0, 10);
      });
      type Day = { date: string; entries: Array<{ entry: Entry; id: string }> };
      const plan: Day[] = [];
      for (const date of days) {
        const entries: Day['entries'] = [];
        for (const entry of GAMES) {
          if (rng.next() < 0.25) continue; // día neutro para este juego (o global si ninguno)
          const voided = rng.next() < 0.1;
          const c = await dbs.insertChallenge({
            gameId: entry.game.id,
            date,
            number: plan.length + 1,
            payload: entry.payload as object,
            status: voided ? 'voided' : 'published',
            ...(voided ? { voidReason: 'x', voidedAt: new Date(`${date}T00:00:00Z`) } : {}),
          });
          entries.push({ entry, id: c.id });
        }
        plan.push({ date, entries });
      }
      const incremental = new ProgressService({ repo: new ProgressRepository(dbs.api.db) });
      for (const { date, entries } of plan) {
        for (const { entry, id } of entries) {
          for (const player of players) {
            const roll = rng.next();
            if (roll < 0.3) continue; // no jugó
            const status = roll < 0.55 ? 'won' : roll < 0.8 ? 'lost' : 'voided';
            const result = status === 'won' ? entry.won : status === 'lost' ? entry.lost : null;
            await dbs.insertPlay({
              playerId: player.id,
              challengeId: id,
              gameId: entry.game.id,
              date,
              state: {},
              status,
              finishedAt: new Date(`${date}T10:00:00Z`),
              ...(result ? { result: result as object, score: 1 } : {}),
            });
            await dbs.api.db.transaction((tx) =>
              incremental.applyResult(new ProgressRepository(tx), {
                playerId: player.id,
                game: entry.game,
                date,
                outcome: status === 'voided' ? { status } : { status, result },
              }),
            );
          }
        }
      }

      const read = async () =>
        JSON.stringify([
          await dbs.owner.sql`SELECT * FROM player_game_stats ORDER BY player_id, game_id`,
          await dbs.owner.sql`SELECT * FROM player_stats ORDER BY player_id`,
        ]);
      const before = await read();
      const ids = players.map((p) => p.id);
      await dbs.api.db.transaction(async (tx) => {
        const svc = new ProgressService({ repo: {} as never });
        for (const { game } of GAMES) {
          await svc.recompute(new ProgressRepository(tx), { playerIds: ids, game });
        }
      });
      expect(JSON.parse(before)[0].length).toBeGreaterThan(3);
      expect(await read()).toBe(before);
    }
  }, 120_000);
});
