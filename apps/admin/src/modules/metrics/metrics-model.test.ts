import { describe, expect, it } from 'vitest';

import { METRICS_EMPTY, METRICS_OK, STREAKS_ZERO } from '@/test/fixtures/metrics';

import {
  DEFAULT_QUALITY_SORT,
  challengeCell,
  dailyRows,
  formatPercent,
  nextSort,
  retentionRows,
  sortQuality,
  streakRows,
} from './metrics-model';

const numbers = (s: Parameters<typeof sortQuality>[1]) =>
  sortQuality(METRICS_OK.challenge_quality, s).map((r) => r.number);

describe('formatPercent', () => {
  it('un decimal y «—» si es null (TS-4)', () => {
    expect(formatPercent(0.9666666666666667)).toBe('96,7 %');
    expect(formatPercent(0.07931034482758621)).toBe('7,9 %');
    expect(formatPercent(0)).toBe('0,0 %');
    expect(formatPercent(1)).toBe('100,0 %');
    expect(formatPercent(null)).toBe('—');
  });
});

describe('dailyRows', () => {
  it('completa los días vacíos en 0, del más reciente al más antiguo (TS-5)', () => {
    expect(dailyRows(METRICS_OK.daily_players, '2026-12-01', '2026-12-03')).toEqual([
      {
        date: '2026-12-03',
        total: 12,
        games: { devdle: 0, 'grep-grid': 7, timeline: 5, 'big-o': 3, 'bug-hunt': 0 },
      },
      {
        date: '2026-12-02',
        total: 0,
        games: { devdle: 0, 'grep-grid': 0, timeline: 0, 'big-o': 0, 'bug-hunt': 0 },
      },
      {
        date: '2026-12-01',
        total: 150,
        games: { devdle: 120, 'grep-grid': 0, timeline: 0, 'big-o': 0, 'bug-hunt': 80 },
      },
    ]);
    expect(dailyRows([], '2026-11-01', '2026-11-30')).toEqual([]);
  });
});

describe('retención y rachas', () => {
  it('ordena cohortes sin mutar y calcula el porcentaje de rachas (TS-6)', () => {
    const original = [...METRICS_OK.retention];
    expect(retentionRows(METRICS_OK.retention).map((r) => r.cohort_date)).toEqual([
      '2026-12-03',
      '2026-12-01',
    ]);
    expect(METRICS_OK.retention).toEqual(original);
    expect(streakRows(METRICS_EMPTY.streak_distribution)).toEqual([
      { label: '0', players: 412, share: '86,4 %' },
      { label: '1', players: 35, share: '7,3 %' },
      { label: '2–6', players: 20, share: '4,2 %' },
      { label: '7–29', players: 8, share: '1,7 %' },
      { label: '30+', players: 2, share: '0,4 %' },
    ]);
    expect(streakRows(STREAKS_ZERO).map((r) => r.share)).toEqual(Array(5).fill('—'));
  });
});

describe('orden de calidad', () => {
  it('ordena por columna con null al final y sin mutar (TS-7)', () => {
    const before = METRICS_OK.challenge_quality.map((r) => r.number);
    expect(numbers(DEFAULT_QUALITY_SORT)).toEqual([8, 7, 6]);
    expect(numbers({ key: 'reports', dir: 'ascending' })).toEqual([6, 8, 7]);
    expect(numbers({ key: 'completion_rate', dir: 'ascending' })).toEqual([7, 8, 6]);
    expect(numbers({ key: 'completion_rate', dir: 'descending' })).toEqual([8, 7, 6]);
    expect(numbers({ key: 'game', dir: 'ascending' })).toEqual([8, 7, 6]);
    expect(METRICS_OK.challenge_quality.map((r) => r.number)).toEqual(before);
    expect(nextSort(DEFAULT_QUALITY_SORT, 'challenge')).toEqual({
      key: 'challenge',
      dir: 'ascending',
    });
    expect(nextSort(DEFAULT_QUALITY_SORT, 'reports')).toEqual({ key: 'reports', dir: 'ascending' });
    expect(challengeCell(METRICS_OK.challenge_quality[0]!)).toBe('#8 · 03/12');
  });
});
