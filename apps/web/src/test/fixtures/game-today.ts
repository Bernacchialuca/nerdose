import type { GameToday, MoveResponse } from '@/modules/game-host/api/game-today';
import type { Today } from '@/modules/catalog/api/today';

import { todayFixture } from './today';

export const DEVDLE_CATEGORIES = [
  'programming_languages',
  'git',
  'databases',
  'networking',
  'linux',
  'apis',
  'security',
  'software_engineering',
];
export const PUBLIC_VIEW_6 = { length: 6, possible_categories: DEVDLE_CATEGORIES };

export const GUESS_BRANCH = {
  guess: 'BRANCH',
  marks: ['absent', 'present', 'present', 'absent', 'absent', 'absent'],
};
export const GUESS_SERVER = {
  guess: 'SERVER',
  marks: ['present', 'absent', 'correct', 'absent', 'correct', 'correct'],
};
export const GUESS_SCRIPT = {
  guess: 'SCRIPT',
  marks: ['present', 'absent', 'correct', 'absent', 'present', 'absent'],
};
export const GUESS_PARSER = {
  guess: 'PARSER',
  marks: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
};

export const RESULT_WIN = {
  win: true,
  score: 3,
  word: 'PARSER',
  category: 'software_engineering',
  definition: 'Programa que analiza una secuencia de texto según una gramática formal.',
  summary: 'Un analizador sintáctico es el componente que valida la estructura de una entrada.',
  guesses: [GUESS_BRANCH, GUESS_SERVER, GUESS_PARSER],
};
export const RESULT_WIN_EN = {
  ...RESULT_WIN,
  definition: 'Program that analyzes a string of text according to a formal grammar.',
  summary: 'A parser is the component that validates the structure of an input.',
};
export const RESULT_LOSS = {
  win: false,
  score: 6,
  word: 'PARSER',
  category: 'software_engineering',
  definition: 'Programa que analiza una secuencia de texto según una gramática formal.',
  summary: 'Un analizador sintáctico es el componente que valida la estructura de una entrada.',
  guesses: [GUESS_BRANCH, GUESS_BRANCH, GUESS_BRANCH, GUESS_SERVER, GUESS_SERVER, GUESS_SERVER],
};

export const GAME_STATS = {
  game_id: 'devdle',
  current_streak: 3,
  max_streak: 7,
  played: 12,
  wins: 11,
  win_rate: 0.9166,
  extra: { guesses: { '1': 0, '2': 1, '3': 4, '4': 3, '5': 2, '6': 1 }, losses: 1 },
};

export const gameTodayNotStarted = {
  game_id: 'devdle',
  date: '2026-11-03',
  number: 128,
  challenge_status: 'published',
  public_view: PUBLIC_VIEW_6,
  play: null,
  result: null,
  game_stats: null,
} satisfies GameToday;

export const gameTodayInProgress = {
  ...gameTodayNotStarted,
  play: {
    status: 'in_progress',
    state: { guesses: [GUESS_BRANCH, GUESS_SERVER] },
    score: null,
    code_language: null,
  },
} satisfies GameToday;

export const gameTodayWon = {
  ...gameTodayNotStarted,
  play: {
    status: 'won',
    state: { guesses: [GUESS_BRANCH, GUESS_SERVER, GUESS_PARSER] },
    score: 3,
    code_language: null,
  },
  result: RESULT_WIN,
  game_stats: GAME_STATS,
} satisfies GameToday;

export const gameTodayLost = {
  ...gameTodayNotStarted,
  play: { status: 'lost', state: { guesses: RESULT_LOSS.guesses }, score: 6, code_language: null },
  result: RESULT_LOSS,
  game_stats: {
    ...GAME_STATS,
    current_streak: 4,
    played: 13,
    extra: { guesses: GAME_STATS.extra.guesses, losses: 2 },
  },
} satisfies GameToday;

export const gameTodayNone = {
  game_id: 'devdle',
  date: '2026-11-03',
  number: 128,
  challenge_status: 'none',
  public_view: null,
  play: null,
  result: null,
  game_stats: null,
} satisfies GameToday;

export const gameTodayVoided = {
  ...gameTodayNone,
  challenge_status: 'voided',
} satisfies GameToday;

export const gameTodayVoidedFinished = {
  ...gameTodayVoided,
  play: {
    status: 'won',
    state: { guesses: [GUESS_BRANCH, GUESS_SERVER, GUESS_PARSER] },
    score: 3,
    code_language: null,
  },
  result: RESULT_WIN,
  game_stats: GAME_STATS,
} satisfies GameToday;

export const gameTodayNextDay = {
  ...gameTodayNotStarted,
  date: '2026-11-04',
  number: 129,
} satisfies GameToday;

export const gameTodayNextDayNone = {
  ...gameTodayNone,
  date: '2026-11-04',
  number: 129,
} satisfies GameToday;

export const moveInProgress = {
  feedback: GUESS_SCRIPT,
  play: {
    status: 'in_progress',
    state: { guesses: [GUESS_BRANCH, GUESS_SERVER, GUESS_SCRIPT] },
    score: null,
  },
  result: null,
  streaks: null,
  game_stats: null,
} satisfies MoveResponse;

export const moveWon = {
  feedback: GUESS_PARSER,
  play: {
    status: 'won',
    state: { guesses: [GUESS_BRANCH, GUESS_SERVER, GUESS_PARSER] },
    score: 3,
  },
  result: RESULT_WIN,
  streaks: { game: { current: 3, max: 7 }, global: { current: 6, max: 12 } },
  game_stats: GAME_STATS,
} satisfies MoveResponse;

export const todayAfterWin = {
  ...todayFixture,
  global_streak: { current: 6, max: 12 },
  completed_today: 2,
} satisfies Today;

export const todayOnlyDevdle = {
  ...todayFixture,
  games: [
    {
      game_id: 'devdle',
      challenge_status: 'published',
      play_status: 'won',
      history_label: '✓ 3/6',
      current_streak: 3,
    },
    ...(['grep-grid', 'timeline', 'big-o', 'bug-hunt'] as const).map((game_id) => ({
      game_id,
      challenge_status: 'none' as const,
      play_status: null,
      history_label: null,
      current_streak: 0,
    })),
  ],
} satisfies Today;
