import type { Today } from '@/modules/catalog/api/today';
import type { GameToday, MoveResponse } from '@/modules/game-host/api/game-today';

import { todayFixture } from './today';

// Valores copiados de `packages/games/grep-grid/src/definition/test-fixtures.ts` (D4): `web` no
// importa nada del paquete fuera de su `./client`.
export const GG_GRID_ROWS = [
  'MERGEJXJXKXC',
  'WQWQWQWQWUWA',
  'VZVZVZKZVBVC',
  'JXDOCKERJEJH',
  'QWQWQWRWQRQE',
  'OVZVZSNVZNZV',
  'XAXJIJEJXEXJ',
  'WQUDWQLQWTWQ',
  'VZETVZVZVEVZ',
  'JRJXHXJXJSJX',
  'QWQWQWQWQWQW',
  'PYTHONZVZVZV',
];
export const GG_GRID = GG_GRID_ROWS.map((r) => [...r]);

export const GG_WORDS = [
  'CACHE',
  'DOCKER',
  'KERNEL',
  'KUBERNETES',
  'MERGE',
  'OAUTH',
  'PYTHON',
  'REDIS',
] as const;
export type WordName = (typeof GG_WORDS)[number];

const idOf = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
export const GG_ID: Record<WordName, string> = {
  CACHE: idOf(1),
  DOCKER: idOf(2),
  KERNEL: idOf(3),
  KUBERNETES: idOf(4),
  MERGE: idOf(5),
  OAUTH: idOf(6),
  PYTHON: idOf(7),
  REDIS: idOf(8),
};

type Cell = { row: number; col: number };

/** Helper de test: recorre la línea de `from` a `to` (horizontal, vertical o diagonal). */
export function cellsBetween(from: Cell, to: Cell): Cell[] {
  const dr = Math.sign(to.row - from.row);
  const dc = Math.sign(to.col - from.col);
  const length = Math.max(Math.abs(to.row - from.row), Math.abs(to.col - from.col)) + 1;
  return Array.from({ length }, (_, i) => ({ row: from.row + dr * i, col: from.col + dc * i }));
}

const LINES: Record<WordName, [Cell, Cell]> = {
  CACHE: [
    { row: 0, col: 11 },
    { row: 4, col: 11 },
  ],
  DOCKER: [
    { row: 3, col: 2 },
    { row: 3, col: 7 },
  ],
  KERNEL: [
    { row: 2, col: 6 },
    { row: 7, col: 6 },
  ],
  KUBERNETES: [
    { row: 0, col: 9 },
    { row: 9, col: 9 },
  ],
  MERGE: [
    { row: 0, col: 0 },
    { row: 0, col: 4 },
  ],
  OAUTH: [
    { row: 5, col: 0 },
    { row: 9, col: 4 },
  ],
  PYTHON: [
    { row: 11, col: 0 },
    { row: 11, col: 5 },
  ],
  REDIS: [
    { row: 9, col: 1 },
    { row: 5, col: 5 },
  ],
};
export const CELLS = Object.fromEntries(
  GG_WORDS.map((w) => [w, cellsBetween(...LINES[w])]),
) as Record<WordName, Cell[]>;

export const FOUND_3: WordName[] = ['MERGE', 'CACHE', 'PYTHON'];
export const FOUND_7: WordName[] = GG_WORDS.filter((w) => w !== 'REDIS');
export const FOUND_6: WordName[] = GG_WORDS.filter((w) => w !== 'OAUTH' && w !== 'REDIS');

const definitionOf = (w: WordName, lang: 'es' | 'en') =>
  lang === 'es' ? `definición de ${w}` : `definition of ${w}`;

export const ggPublicView = (defined: readonly WordName[], lang: 'es' | 'en' = 'es') => ({
  grid: GG_GRID,
  words: GG_WORDS.map((w) => ({
    term_id: GG_ID[w],
    word: w,
    ...(defined.includes(w) && { definition: definitionOf(w, lang) }),
  })),
});

export const ggState = (found: readonly WordName[], gave_up = false) => ({
  found_words: found.map((w) => ({ term_id: GG_ID[w], cells: CELLS[w] })),
  gave_up,
});

export const ggResult = (found: readonly WordName[], lang: 'es' | 'en' = 'es') => ({
  win: found.length === 8,
  score: found.length,
  gave_up: found.length < 8,
  words: GG_WORDS.map((w) => ({
    term_id: GG_ID[w],
    word: w,
    definition: definitionOf(w, lang),
    found: found.includes(w),
    cells: CELLS[w],
  })),
});

export const GG_STATS = {
  game_id: 'grep-grid',
  current_streak: 2,
  max_streak: 4,
  played: 5,
  wins: 3,
  win_rate: 0.6,
  extra: {
    words_found: { '0': 0, '1': 0, '2': 0, '3': 1, '4': 0, '5': 0, '6': 1, '7': 0, '8': 3 },
  },
};

export const grepGridNotStarted = {
  game_id: 'grep-grid',
  date: '2026-11-03',
  number: 128,
  challenge_status: 'published',
  public_view: ggPublicView([]),
  play: null,
  result: null,
  game_stats: null,
} satisfies GameToday;

export const grepGridStarted = {
  play: {
    status: 'in_progress',
    state: { found_words: [], gave_up: false },
    score: null,
    code_language: null,
  },
};

const inProgress = (found: readonly WordName[]) =>
  ({
    status: 'in_progress',
    state: ggState(found),
    score: null,
    code_language: null,
  }) as const;

export const grepGridInProgress0 = {
  ...grepGridNotStarted,
  play: inProgress([]),
} satisfies GameToday;

export const grepGridInProgress3 = {
  ...grepGridNotStarted,
  public_view: ggPublicView(FOUND_3),
  play: inProgress(FOUND_3),
} satisfies GameToday;

export const grepGridInProgress3En = {
  ...grepGridInProgress3,
  public_view: ggPublicView(FOUND_3, 'en'),
} satisfies GameToday;

export const grepGridInProgress7 = {
  ...grepGridNotStarted,
  public_view: ggPublicView(FOUND_7),
  play: inProgress(FOUND_7),
} satisfies GameToday;

export const grepGridWon = {
  ...grepGridNotStarted,
  play: { status: 'won', state: ggState(GG_WORDS), score: 8, code_language: null },
  result: ggResult(GG_WORDS),
  game_stats: { ...GG_STATS, current_streak: 3, played: 6, wins: 4 },
} satisfies GameToday;

export const grepGridLost6 = {
  ...grepGridNotStarted,
  play: { status: 'lost', state: ggState(FOUND_6, true), score: 6, code_language: null },
  result: ggResult(FOUND_6),
  game_stats: { ...GG_STATS, current_streak: 3, played: 6 },
} satisfies GameToday;

export const grepGridLost3En = {
  ...grepGridNotStarted,
  public_view: ggPublicView([], 'en'),
  play: { status: 'lost', state: ggState(FOUND_3, true), score: 3, code_language: null },
  result: ggResult(FOUND_3, 'en'),
  game_stats: GG_STATS,
} satisfies GameToday;

export const grepGridNone = {
  game_id: 'grep-grid',
  date: '2026-11-03',
  number: 128,
  challenge_status: 'none',
  public_view: null,
  play: null,
  result: null,
  game_stats: null,
} satisfies GameToday;

export const grepGridVoided = {
  ...grepGridNone,
  challenge_status: 'voided',
} satisfies GameToday;

export const grepGridNextDay = {
  ...grepGridNotStarted,
  date: '2026-11-04',
  number: 129,
} satisfies GameToday;

export const FB_DOCKER = {
  found: true,
  term_id: GG_ID.DOCKER,
  word: 'DOCKER',
  definition: 'definición de DOCKER',
  cells: CELLS.DOCKER,
};
export const FB_NOT_A_WORD = { found: false, reason: 'not_a_word' };
export const FB_ALREADY = { found: false, reason: 'already_found' };

const STREAKS = { game: { current: 3, max: 4 }, global: { current: 6, max: 12 } };

export const ggMoveDocker = {
  feedback: FB_DOCKER,
  play: { status: 'in_progress', state: ggState([...FOUND_3, 'DOCKER']), score: null },
  result: null,
  streaks: null,
  game_stats: null,
} satisfies MoveResponse;

export const ggMoveNotAWord = {
  feedback: FB_NOT_A_WORD,
  play: { status: 'in_progress', state: ggState(FOUND_3), score: null },
  result: null,
  streaks: null,
  game_stats: null,
} satisfies MoveResponse;

export const ggMoveAlready = { ...ggMoveNotAWord, feedback: FB_ALREADY } satisfies MoveResponse;

export const ggMoveGiveUp3 = {
  feedback: null,
  play: { status: 'lost', state: ggState(FOUND_3, true), score: 3 },
  result: ggResult(FOUND_3),
  streaks: STREAKS,
  game_stats: { ...GG_STATS, current_streak: 3, played: 6 },
} satisfies MoveResponse;

export const ggMoveWinRedis = {
  feedback: {
    found: true,
    term_id: GG_ID.REDIS,
    word: 'REDIS',
    definition: 'definición de REDIS',
    cells: CELLS.REDIS,
  },
  play: { status: 'won', state: ggState(GG_WORDS), score: 8 },
  result: ggResult(GG_WORDS),
  streaks: STREAKS,
  game_stats: grepGridWon.game_stats,
} satisfies MoveResponse;

export const SELECT_DOCKER = {
  challenge_number: 128,
  move: { type: 'select', from: { row: 3, col: 2 }, to: { row: 3, col: 7 } },
};
export const SELECT_REDIS = {
  challenge_number: 128,
  move: { type: 'select', from: { row: 9, col: 1 }, to: { row: 5, col: 5 } },
};
export const GIVE_UP = { challenge_number: 128, move: { type: 'give_up' } };

export function todayWithGrepGrid(
  play_status: 'in_progress' | 'won' | 'lost' | null,
  history_label: string | null,
) {
  const finished = play_status === 'won' || play_status === 'lost';
  const none = (game_id: 'timeline' | 'big-o' | 'bug-hunt') => ({
    game_id,
    challenge_status: 'none' as const,
    play_status: null,
    history_label: null,
    current_streak: 0,
  });
  return {
    ...todayFixture,
    completed_today: 1 + (finished ? 1 : 0),
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
        play_status,
        history_label,
        current_streak: 2,
      },
      none('timeline'),
      none('big-o'),
      none('bug-hunt'),
    ],
  } satisfies Today;
}
