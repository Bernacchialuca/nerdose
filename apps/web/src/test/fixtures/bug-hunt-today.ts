import type { Today } from '@/modules/catalog/api/today';
import type { GameToday, MoveResponse } from '@/modules/game-host/api/game-today';

import { todayFixture } from './today';

// Valores copiados de `docs/apis/api.yaml` y de `packages/games/bug-hunt/src/client/test-fixtures.ts`:
// `web` no importa nada del paquete fuera de su `./client`.
type Lang = 'es' | 'en';
type CodeLang = 'js' | 'go' | 'java';

export const BH_CODE = {
  js: [
    'function maxIndex(nums) {',
    '  let best = 0;',
    '  for (let i = 1; i < nums.length; i++) {',
    '    if (nums[i] >= nums[best]) {',
    '      best = i;',
    '    }',
    '  }',
    '  return best;',
    '}',
  ].join('\n'),
  go: [
    'func maxIndex(nums []int) int {',
    '\tbest := 0',
    '\tfor i := 1; i < len(nums); i++ {',
    '\t\tif nums[i] >= nums[best] {',
    '\t\t\tbest = i',
    '\t\t}',
    '\t}',
    '\treturn best',
    '}',
  ].join('\n'),
  java: [
    'static int maxIndex(int[] nums) {',
    '    int best = 0;',
    '    for (int i = 1; i < nums.length; i++) {',
    '        if (nums[i] >= nums[best]) {',
    '            best = i;',
    '        }',
    '    }',
    '    return best;',
    '}',
  ].join('\n'),
};
export const BH_SPEC = {
  es: 'Devuelve el índice del mayor valor de nums; si el máximo se repite, el del primero. Con nums vacío devuelve 0.',
  en: 'Returns the index of the largest value in nums; if the maximum repeats, the first one. With an empty nums it returns 0.',
};
export const BH_PICKABLE = [2, 3, 4, 5, 8];
export const bhPublicView = (lang: Lang = 'es') => ({
  function_name: 'maxIndex',
  spec: BH_SPEC[lang],
  code: BH_CODE,
  pickable_lines: BH_PICKABLE,
  visible_tests: [
    { input: [[]], expected: 0 },
    { input: [[4]], expected: 0 },
    { input: [[3, 7, 2]], expected: 1 },
  ],
});

const BH_FIX = {
  js: { before: '    if (nums[i] >= nums[best]) {', after: '    if (nums[i] > nums[best]) {' },
  go: { before: '\t\tif nums[i] >= nums[best] {', after: '\t\tif nums[i] > nums[best] {' },
  java: {
    before: '        if (nums[i] >= nums[best]) {',
    after: '        if (nums[i] > nums[best]) {',
  },
};
const STEPS = {
  es: [
    'La condición que decide si best cambia usa >= en lugar de >: con un empate también se mueve.',
    'Con [5, 1, 5], al llegar a i = 2 se cumple 5 >= 5 y devuelve 2 en lugar de 0.',
    'Los tests visibles no repiten el máximo, por eso pasan. El fix: volver a >.',
  ],
  en: [
    'The condition that decides whether best changes uses >= instead of >: on a tie it moves too.',
    'With [5, 1, 5], at i = 2 the check 5 >= 5 holds and it returns 2 instead of 0.',
    'The visible tests never repeat the maximum, so they pass. The fix: go back to >.',
  ],
};
export const bhResult = (chosen: number, language: CodeLang, lang: Lang = 'es') => ({
  win: chosen === 4,
  score: chosen === 4 ? 1 : 0,
  chosen_line: chosen,
  code_language: language,
  bug_line: 4,
  bug_type: 'comparison',
  function_name: 'maxIndex',
  failing_test: { input: [[5, 1, 5]], expected: 0, actual: 2 },
  fix: BH_FIX,
  explanation: { steps: STEPS[lang] },
});

export const BH_STATS = {
  game_id: 'bug-hunt',
  current_streak: 6,
  max_streak: 9,
  played: 8,
  wins: 6,
  win_rate: 0.75,
  extra: {
    by_language: {
      js: { played: 4, correct: 3 },
      go: { played: 3, correct: 2 },
      java: { played: 1, correct: 1 },
    },
    by_bug_type: {
      off_by_one: { played: 4, correct: 3 },
      comparison: { played: 4, correct: 3 },
    },
  },
};
export const BH_STREAKS = { game: { current: 6, max: 9 }, global: { current: 8, max: 12 } };

export const bugHuntNotStarted = {
  game_id: 'bug-hunt',
  date: '2026-11-03',
  number: 128,
  challenge_status: 'published',
  public_view: bhPublicView(),
  play: null,
  result: null,
  game_stats: null,
  reported: false,
} satisfies GameToday;
export const bugHuntNotStartedEn = {
  ...bugHuntNotStarted,
  public_view: bhPublicView('en'),
} satisfies GameToday;

export const bugHuntStarted = {
  play: { status: 'in_progress', state: {}, score: null, code_language: null },
} satisfies Pick<GameToday, 'play'>;
export const bugHuntInProgress = { ...bugHuntNotStarted, ...bugHuntStarted } satisfies GameToday;
export const bugHuntInProgressEn = {
  ...bugHuntNotStartedEn,
  ...bugHuntStarted,
} satisfies GameToday;

const bhPlay = (chosen: number, language: CodeLang) =>
  ({
    status: chosen === 4 ? 'won' : 'lost',
    state: { language, line: chosen },
    score: chosen === 4 ? 1 : 0,
    code_language: language,
  }) as const;

export const bugHuntFinished = (chosen: number, language: CodeLang, lang: Lang = 'es') =>
  ({
    ...bugHuntNotStarted,
    public_view: bhPublicView(lang),
    play: bhPlay(chosen, language),
    result: bhResult(chosen, language, lang),
    game_stats: BH_STATS,
  }) satisfies GameToday;

export const bugHuntWonJava = bugHuntFinished(4, 'java');
export const bugHuntWonJavaEn = bugHuntFinished(4, 'java', 'en');
export const bugHuntLostGo = bugHuntFinished(5, 'go');
export const bugHuntNone = {
  ...bugHuntNotStarted,
  challenge_status: 'none',
  public_view: null,
} satisfies GameToday;
export const bugHuntVoided = { ...bugHuntNone, challenge_status: 'voided' } satisfies GameToday;
export const bugHuntNextDay = {
  ...bugHuntNotStarted,
  date: '2026-11-04',
  number: 129,
} satisfies GameToday;

export const bhMove = (chosen: number, language: CodeLang, lang: Lang = 'es') =>
  ({
    feedback: null,
    play: bhPlay(chosen, language),
    result: bhResult(chosen, language, lang),
    streaks: BH_STREAKS,
    game_stats: BH_STATS,
  }) satisfies MoveResponse;

export const MOVE_JAVA_L4 = { challenge_number: 128, move: { language: 'java', line: 4 } };
export const MOVE_GO_L4 = { challenge_number: 128, move: { language: 'go', line: 4 } };

export function todayWithBugHunt(
  play_status: 'in_progress' | 'won' | 'lost' | null,
  history_label: string | null,
) {
  const none = (game_id: 'grep-grid' | 'timeline' | 'big-o') => ({
    game_id,
    challenge_status: 'none' as const,
    play_status: null,
    history_label: null,
    current_streak: 0,
  });
  const finished = play_status === 'won' || play_status === 'lost';
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
      none('big-o'),
      {
        game_id: 'bug-hunt',
        challenge_status: 'published',
        play_status,
        history_label,
        current_streak: 2,
      },
    ],
  } satisfies Today;
}
