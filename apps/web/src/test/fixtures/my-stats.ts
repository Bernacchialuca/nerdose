import type { MyStats } from '@/modules/stats/api/my-stats';

export const myStatsPage1 = {
  today: '2026-11-03',
  global: { current_streak: 4, max_streak: 9, total_completed: 31 },
  games: [
    {
      game_id: 'devdle',
      current_streak: 3,
      max_streak: 7,
      played: 21,
      wins: 16,
      win_rate: 0.7619,
      extra: { guesses: { '1': 1, '2': 3, '3': 5, '4': 4, '5': 2, '6': 1 }, losses: 5 },
    },
    {
      game_id: 'grep-grid',
      current_streak: 0,
      max_streak: 4,
      played: 12,
      wins: 5,
      win_rate: 0.4167,
      extra: {
        words_found: { '0': 0, '1': 0, '2': 0, '3': 1, '4': 2, '5': 1, '6': 2, '7': 1, '8': 5 },
      },
    },
    {
      game_id: 'timeline',
      current_streak: 1,
      max_streak: 5,
      played: 15,
      wins: 6,
      win_rate: 0.4,
      extra: {
        by_category: {
          programming_languages: { played: 40, correct: 24 },
          frameworks: { played: 35, correct: 12 },
        },
      },
    },
    {
      game_id: 'big-o',
      current_streak: 5,
      max_streak: 9,
      played: 27,
      wins: 23,
      win_rate: 0.8519,
      extra: {
        by_category: {
          simple_loops: { played: 10, correct: 9 },
          nested_loops: { played: 17, correct: 14 },
        },
      },
    },
    {
      game_id: 'bug-hunt',
      current_streak: 0,
      max_streak: 6,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: { by_language: {}, by_bug_type: {} },
    },
  ],
  heatmap: [
    { date: '2026-11-02', completed: 5 },
    { date: '2026-11-03', completed: 2 },
  ],
  history: [
    { date: '2026-11-03', number: 128, game_id: 'devdle', status: 'won', label: '✓ 4/6' },
    { date: '2026-11-03', number: 128, game_id: 'grep-grid', status: 'lost', label: '6/8' },
    { date: '2026-11-02', number: 127, game_id: 'big-o', status: 'voided', label: 'anulado' },
  ],
  history_next_before: '2026-11-02',
} satisfies MyStats;

export const myStatsPage2 = {
  ...myStatsPage1,
  history: [
    { date: '2026-11-01', number: 126, game_id: 'timeline', status: 'won', label: '✓ 4/5' },
    { date: '2026-10-31', number: 125, game_id: 'devdle', status: 'lost', label: '✗ X/6' },
  ],
  history_next_before: null,
} satisfies MyStats;

/** Jugador nuevo: ceros, `win_rate` null y `extra` inicial de cada juego. */
export const myStatsEmpty = {
  today: '2026-11-03',
  global: { current_streak: 0, max_streak: 0, total_completed: 0 },
  games: [
    {
      game_id: 'devdle',
      current_streak: 0,
      max_streak: 0,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: { guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }, losses: 0 },
    },
    {
      game_id: 'grep-grid',
      current_streak: 0,
      max_streak: 0,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: {
        words_found: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 },
      },
    },
    {
      game_id: 'timeline',
      current_streak: 0,
      max_streak: 0,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: { by_category: {} },
    },
    {
      game_id: 'big-o',
      current_streak: 0,
      max_streak: 0,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: { by_category: {} },
    },
    {
      game_id: 'bug-hunt',
      current_streak: 0,
      max_streak: 0,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: { by_language: {}, by_bug_type: {} },
    },
  ],
  heatmap: [],
  history: [],
  history_next_before: null,
} satisfies MyStats;
