import { devdle } from '@nerdose/game-devdle/definition';
import { describe, expect, it } from 'vitest';

import { toGameStatsView } from '@/domain/progress/game-stats-view';

const row = (lastCompletedDate: string) => ({
  playerId: 'p',
  gameId: 'devdle' as const,
  currentStreak: 3,
  maxStreak: 5,
  played: 0,
  wins: 0,
  lastCompletedDate,
  extra: { x: 1 },
});

describe('toGameStatsView', () => {
  it('TS-26a sin fila: ceros y extra inicial', () => {
    expect(toGameStatsView(devdle, null, null, '2026-12-02')).toEqual({
      game_id: 'devdle',
      current_streak: 0,
      max_streak: 0,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: devdle.initialStats(),
    });
  });

  it('TS-26b racha viva y win_rate null con played 0', () => {
    const v = toGameStatsView(devdle, row('2026-12-01'), '2026-12-01', '2026-12-02');
    expect(v.current_streak).toBe(3);
    expect(v.win_rate).toBeNull();
  });

  it('TS-26c racha vieja: 0 conservando el récord', () => {
    const v = toGameStatsView(devdle, row('2026-11-28'), '2026-12-01', '2026-12-02');
    expect(v.current_streak).toBe(0);
    expect(v.max_streak).toBe(5);
  });

  it('win_rate = wins / played', () => {
    const v = toGameStatsView(
      devdle,
      { ...row('2026-12-01'), played: 10, wins: 8 },
      null,
      '2026-12-02',
    );
    expect(v.win_rate).toBe(0.8);
  });
});
