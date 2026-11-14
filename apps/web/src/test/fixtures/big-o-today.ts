import type { Today } from '@/modules/catalog/api/today';
import type { GameToday, MoveResponse } from '@/modules/game-host/api/game-today';

import { todayFixture } from './today';

// Valores copiados de `docs/apis/api.yaml` y de `packages/games/big-o/src/client/test-fixtures.ts`:
// `web` no importa nada del paquete fuera de su `./client`.
export const BO_CODE = {
  js: 'function f(n) {\n  let ops = 0;\n  for (let i = 0; i < n; i++) {\n    for (let j = 1; j < n; j *= 2) {\n      ops++;\n    }\n  }\n  return ops;\n}',
  go: 'func f(n int) int {\n\tops := 0\n\tfor i := 0; i < n; i++ {\n\t\tfor j := 1; j < n; j *= 2 {\n\t\t\tops++\n\t\t}\n\t}\n\treturn ops\n}',
  java: 'static int f(int n) {\n    int ops = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 1; j < n; j *= 2) {\n            ops++;\n        }\n    }\n    return ops;\n}',
};
export const BO_OPTIONS = [
  'o_1',
  'o_log_n',
  'o_n',
  'o_n_log_n',
  'o_n2',
  'o_n3',
  'o_2n',
  'o_n_fact',
];
export const BO_LABELS = [
  'O(1)',
  'O(log n)',
  'O(n)',
  'O(n log n)',
  'O(n²)',
  'O(n³)',
  'O(2ⁿ)',
  'O(n!)',
];
export const boPublicView = () => ({ code: BO_CODE, options: BO_OPTIONS });

type Lang = 'es' | 'en';
type CodeLang = 'js' | 'go' | 'java';

const EXPLANATION = {
  es: {
    steps: [
      'El loop externo corre n veces.',
      'El interno duplica j: log₂ n vueltas.',
      'Anidados se multiplican: n × log n. Simplificado: O(n log n).',
    ],
    line_notes: [
      { line: 3, text: 'n veces' },
      { line: 4, text: 'log n veces' },
    ],
    tip: 'Un loop interno que duplica su variable no es n.',
    example: { n: 1024, ops: 10240, trap_ops: 1048576 },
  },
  en: {
    steps: [
      'The outer loop runs n times.',
      'The inner loop doubles j: log₂ n iterations.',
      'Nested loops multiply: n × log n. Simplified: O(n log n).',
    ],
    line_notes: [
      { line: 3, text: 'n times' },
      { line: 4, text: 'log n times' },
    ],
    tip: 'An inner loop that doubles its variable is not n.',
    example: { n: 1024, ops: 10240, trap_ops: 1048576 },
  },
};

export const boResult = (chosen: string, language: CodeLang, lang: Lang = 'es') => ({
  win: chosen === 'o_n_log_n',
  score: chosen === 'o_n_log_n' ? 1 : 0,
  answer: 'o_n_log_n',
  chosen_option: chosen,
  code_language: language,
  recipe_category: 'nested_loops',
  trap_option: 'o_n2',
  explanation: EXPLANATION[lang],
});
export const boResultPlain = () => ({
  ...boResult('o_n_log_n', 'js'),
  trap_option: null,
  explanation: { ...EXPLANATION.es, tip: null, example: null },
});

export const BO_STATS = {
  game_id: 'big-o',
  current_streak: 4,
  max_streak: 9,
  played: 12,
  wins: 8,
  win_rate: 0.67,
  extra: {
    by_category: { nested_loops: { played: 7, correct: 5 }, recursion: { played: 5, correct: 3 } },
  },
};
export const BO_STREAKS = { game: { current: 4, max: 9 }, global: { current: 6, max: 12 } };

export const bigONotStarted = {
  game_id: 'big-o',
  date: '2026-11-03',
  number: 128,
  challenge_status: 'published',
  public_view: boPublicView(),
  play: null,
  result: null,
  game_stats: null,
  reported: false,
} satisfies GameToday;

export const bigOStarted = {
  play: { status: 'in_progress', state: {}, score: null, code_language: null },
} satisfies Pick<GameToday, 'play'>;

export const bigOInProgress = { ...bigONotStarted, ...bigOStarted } satisfies GameToday;

const playOf = (chosen: string, language: CodeLang) =>
  ({
    status: chosen === 'o_n_log_n' ? 'won' : 'lost',
    state: { language, option: chosen },
    score: chosen === 'o_n_log_n' ? 1 : 0,
    code_language: language,
  }) as const;

export const bigOFinished = (chosen: string, language: CodeLang, lang: Lang = 'es') =>
  ({
    ...bigONotStarted,
    play: playOf(chosen, language),
    result: boResult(chosen, language, lang),
    game_stats: BO_STATS,
  }) satisfies GameToday;

export const bigOWonJava = bigOFinished('o_n_log_n', 'java');
export const bigOWonJavaEn = bigOFinished('o_n_log_n', 'java', 'en');
export const bigOLostGo = bigOFinished('o_n2', 'go');
export const bigOPlain = {
  ...bigOWonJava,
  result: boResultPlain(),
  play: {
    ...bigOWonJava.play,
    state: { language: 'js', option: 'o_n_log_n' },
    code_language: 'js',
  },
} satisfies GameToday;
export const bigONone = {
  ...bigONotStarted,
  challenge_status: 'none',
  public_view: null,
} satisfies GameToday;
export const bigOVoided = { ...bigONone, challenge_status: 'voided' } satisfies GameToday;
export const bigONextDay = {
  ...bigONotStarted,
  date: '2026-11-04',
  number: 129,
} satisfies GameToday;

export const boMove = (chosen: string, language: CodeLang, lang: Lang = 'es') =>
  ({
    feedback: null,
    play: playOf(chosen, language),
    result: boResult(chosen, language, lang),
    streaks: BO_STREAKS,
    game_stats: BO_STATS,
  }) satisfies MoveResponse;

export const MOVE_JAVA_NLOGN = {
  challenge_number: 128,
  move: { language: 'java', option: 'o_n_log_n' },
};
export const MOVE_GO_NLOGN = {
  challenge_number: 128,
  move: { language: 'go', option: 'o_n_log_n' },
};

export function todayWithBigO(
  play_status: 'in_progress' | 'won' | 'lost' | null,
  history_label: string | null,
) {
  const finished = play_status === 'won' || play_status === 'lost';
  const none = (game_id: 'grep-grid' | 'timeline' | 'bug-hunt') => ({
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
      none('timeline'),
      {
        game_id: 'big-o',
        challenge_status: 'published',
        play_status,
        history_label,
        current_streak: 2,
      },
      none('bug-hunt'),
    ],
  } satisfies Today;
}
