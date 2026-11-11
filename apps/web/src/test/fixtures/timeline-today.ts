import type { Today } from '@/modules/catalog/api/today';
import type { GameToday, MoveResponse } from '@/modules/game-host/api/game-today';

import { todayFixture } from './today';

// Valores copiados de `packages/games/timeline/src/{definition,client}/test-fixtures.ts` (D4):
// `web` no importa nada del paquete fuera de su `./client`.
export const TL_OID = {
  PYTHON: 'p7k2m9',
  JAVA: 'j4x8q1',
  GO: 'g2n5w3',
  DOCKER: 'd9r6t0',
  KUBERNETES: 'k1v3s8',
} as const;

export const TL_LABEL: Record<string, string> = {
  p7k2m9: 'Python',
  j4x8q1: 'Java',
  g2n5w3: 'Go',
  d9r6t0: 'Docker',
  k1v3s8: 'Kubernetes',
};

export const TL_INITIAL = ['g2n5w3', 'k1v3s8', 'p7k2m9', 'd9r6t0', 'j4x8q1'];
export const TL_CORRECT = ['p7k2m9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'k1v3s8'];
export const TL_SWAP = ['p7k2m9', 'g2n5w3', 'j4x8q1', 'd9r6t0', 'k1v3s8'];
export const TL_ROTATED = ['j4x8q1', 'g2n5w3', 'd9r6t0', 'k1v3s8', 'p7k2m9'];

type Lang = 'es' | 'en';

export const TL_ITEMS = (lang: Lang = 'es') => {
  const note = (label: string) => (lang === 'es' ? `nota de ${label}` : `note on ${label}`);
  const row = (
    opaque_id: string,
    event_date: string,
    date_precision: 'day' | 'month' | 'year',
  ) => ({
    opaque_id,
    label: TL_LABEL[opaque_id] as string,
    event_date,
    date_precision,
    note: note(TL_LABEL[opaque_id] as string),
  });
  return [
    row(TL_OID.PYTHON, '1991-02-20', 'day'),
    row(TL_OID.JAVA, '1995-05-23', 'day'),
    row(TL_OID.GO, '2009-01-01', 'year'),
    row(TL_OID.DOCKER, '2013-03-20', 'day'),
    row(TL_OID.KUBERNETES, '2014-06-01', 'month'),
  ];
};

export const tlPublicView = (lang: Lang = 'es') => ({
  category: 'programming_languages',
  prompt:
    lang === 'es'
      ? 'Ordená estos lenguajes del más antiguo al más reciente'
      : 'Order these languages from oldest to newest',
  items: TL_INITIAL.map((id) => ({ opaque_id: id, label: TL_LABEL[id] as string })),
});

export const tlResult = (submitted: string[], lang: Lang = 'es') => {
  const score = submitted.filter((id, i) => id === TL_CORRECT[i]).length;
  return {
    win: score === 5,
    score,
    category: 'programming_languages',
    correct_order: TL_CORRECT,
    submitted_order: submitted,
    items: TL_ITEMS(lang),
  };
};

export const TL_STATS = {
  game_id: 'timeline',
  current_streak: 2,
  max_streak: 4,
  played: 5,
  wins: 2,
  win_rate: 0.4,
  extra: { by_category: { programming_languages: { played: 5, correct: 17 } } },
};

export const STREAKS = { game: { current: 3, max: 4 }, global: { current: 6, max: 12 } };

export const timelineNotStarted = {
  game_id: 'timeline',
  date: '2026-11-03',
  number: 128,
  challenge_status: 'published',
  public_view: tlPublicView('es'),
  play: null,
  result: null,
  game_stats: null,
} satisfies GameToday;

export const timelineStarted = {
  play: { status: 'in_progress', state: {}, score: null, code_language: null },
};

export const timelineInProgress = {
  ...timelineNotStarted,
  play: { status: 'in_progress', state: {}, score: null, code_language: null },
} satisfies GameToday;

export const timelineInProgressEn = {
  ...timelineInProgress,
  public_view: tlPublicView('en'),
} satisfies GameToday;

export const timelineLost3 = {
  ...timelineNotStarted,
  play: { status: 'lost', state: { order: TL_SWAP }, score: 3, code_language: null },
  result: tlResult(TL_SWAP),
  game_stats: { ...TL_STATS, current_streak: 3, played: 6 },
} satisfies GameToday;

export const timelineLost3En = {
  ...timelineLost3,
  public_view: tlPublicView('en'),
  result: tlResult(TL_SWAP, 'en'),
} satisfies GameToday;

export const timelineWon = {
  ...timelineNotStarted,
  play: { status: 'won', state: { order: TL_CORRECT }, score: 5, code_language: null },
  result: tlResult(TL_CORRECT),
  game_stats: { ...TL_STATS, current_streak: 3, played: 6, wins: 3 },
} satisfies GameToday;

export const timelineLost0 = {
  ...timelineNotStarted,
  play: { status: 'lost', state: { order: TL_ROTATED }, score: 0, code_language: null },
  result: tlResult(TL_ROTATED),
  game_stats: { ...TL_STATS, current_streak: 3, played: 6 },
} satisfies GameToday;

export const timelineNone = {
  game_id: 'timeline',
  date: '2026-11-03',
  number: 128,
  challenge_status: 'none',
  public_view: null,
  play: null,
  result: null,
  game_stats: null,
} satisfies GameToday;

export const timelineVoided = {
  ...timelineNone,
  challenge_status: 'voided',
} satisfies GameToday;

export const timelineNextDay = {
  ...timelineNotStarted,
  date: '2026-11-04',
  number: 129,
} satisfies GameToday;

export const tlMove3 = {
  feedback: null,
  play: { status: 'lost', state: { order: TL_SWAP }, score: 3 },
  result: tlResult(TL_SWAP),
  streaks: STREAKS,
  game_stats: timelineLost3.game_stats,
} satisfies MoveResponse;

export const tlMove5 = {
  feedback: null,
  play: { status: 'won', state: { order: TL_CORRECT }, score: 5 },
  result: tlResult(TL_CORRECT),
  streaks: STREAKS,
  game_stats: timelineWon.game_stats,
} satisfies MoveResponse;

export const ORDER_SWAP = { challenge_number: 128, move: { order: TL_SWAP } };
export const ORDER_CORRECT = { challenge_number: 128, move: { order: TL_CORRECT } };

export function todayWithTimeline(
  play_status: 'in_progress' | 'won' | 'lost' | null,
  history_label: string | null,
) {
  const finished = play_status === 'won' || play_status === 'lost';
  const none = (game_id: 'grep-grid' | 'big-o' | 'bug-hunt') => ({
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
      none('grep-grid'),
      {
        game_id: 'timeline',
        challenge_status: 'published',
        play_status,
        history_label,
        current_streak: 2,
      },
      none('big-o'),
      none('bug-hunt'),
    ],
  } satisfies Today;
}
