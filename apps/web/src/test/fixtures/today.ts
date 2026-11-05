import { GAME_IDS } from '@nerdose/core';

import type { Today } from '@/modules/catalog/api/today';

export const todayFixture = {
  date: '2026-11-03',
  number: 128,
  next_reset_at: '2026-11-04T00:00:00Z',
  seconds_to_reset: 41000,
  has_session: true,
  global_streak: { current: 5, max: 12 },
  completed_today: 1,
  games: [
    {
      game_id: 'devdle',
      challenge_status: 'published',
      play_status: 'won',
      history_label: '✓ 4/6',
      current_streak: 5,
    },
    {
      game_id: 'grep-grid',
      challenge_status: 'published',
      play_status: 'in_progress',
      history_label: null,
      current_streak: 2,
    },
    {
      game_id: 'timeline',
      challenge_status: 'published',
      play_status: null,
      history_label: null,
      current_streak: 0,
    },
    {
      game_id: 'big-o',
      challenge_status: 'none',
      play_status: null,
      history_label: null,
      current_streak: 3,
    },
    {
      game_id: 'bug-hunt',
      challenge_status: 'voided',
      play_status: null,
      history_label: null,
      current_streak: 1,
    },
  ],
} satisfies Today;

export const todayNoSessionFixture = {
  ...todayFixture,
  has_session: false,
  global_streak: { current: 0, max: 0 },
  completed_today: 0,
  games: todayFixture.games.map((g) => ({ ...g, play_status: null, history_label: null })),
} satisfies Today;

export const todayNoChallengesFixture = {
  date: '2026-12-01',
  number: 8,
  next_reset_at: '2026-12-02T00:00:00Z',
  seconds_to_reset: 10,
  has_session: true,
  global_streak: { current: 0, max: 0 },
  completed_today: 0,
  games: GAME_IDS.map((game_id) => ({
    game_id,
    challenge_status: 'none' as const,
    play_status: null,
    history_label: null,
    current_streak: 0,
  })),
} satisfies Today;

export const todayNextDayFixture = {
  ...todayNoChallengesFixture,
  date: '2026-12-02',
  number: 9,
  next_reset_at: '2026-12-03T00:00:00Z',
  seconds_to_reset: 86400,
} satisfies Today;

export const todayBeforeLaunchFixture = {
  ...todayNoChallengesFixture,
  date: '2026-11-20',
  number: null,
  next_reset_at: '2026-11-21T00:00:00Z',
  seconds_to_reset: 3600,
} satisfies Today;

export const todayFirstVisitFixture = {
  ...todayNoChallengesFixture,
  games: GAME_IDS.map((game_id) => ({
    game_id,
    challenge_status: 'published' as const,
    play_status: null,
    history_label: null,
    current_streak: 0,
  })),
} satisfies Today;
