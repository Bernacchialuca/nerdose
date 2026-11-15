import type { CodeLanguage } from '@nerdose/core';
import {
  payloadSchema,
  type BugHuntPayload,
  type BugHuntResult,
  type BugHuntState,
} from '@nerdose/game-bug-hunt/definition';

import { MUTATION_HEADERS } from './app';
import type { useDatabases } from './db';

type Dbs = ReturnType<typeof useDatabases>;
type Locale = 'es' | 'en';

const CODE = {
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

const SPEC = {
  es: 'Devuelve el índice del mayor valor de nums; si el máximo se repite, el del primero. Con nums vacío devuelve 0.',
  en: 'Returns the index of the largest value in nums; if the maximum repeats, the first one. With an empty nums it returns 0.',
};

const FIX = {
  js: '    if (nums[i] > nums[best]) {',
  go: '\t\tif nums[i] > nums[best] {',
  java: '        if (nums[i] > nums[best]) {',
};

const STEPS = [
  {
    es: 'La condición que decide si best cambia usa >= en lugar de >: con un empate también se mueve.',
    en: 'The condition that decides whether best changes uses >= instead of >: on a tie it moves too.',
  },
  {
    es: 'Con [5, 1, 5], al llegar a i = 2 se cumple 5 >= 5 y devuelve 2 en lugar de 0.',
    en: 'With [5, 1, 5], at i = 2 the check 5 >= 5 holds and it returns 2 instead of 0.',
  },
  {
    es: 'Los tests visibles no repiten el máximo, por eso pasan. El fix: volver a >.',
    en: 'The visible tests never repeat the maximum, so they pass. The fix: go back to >.',
  },
];

const VISIBLE = [
  { input: [[]], expected: 0 },
  { input: [[4]], expected: 0 },
  { input: [[3, 7, 2]], expected: 1 },
];

// Falla en el import si la fixture queda mal formada.
export const BH_PAYLOAD: BugHuntPayload = payloadSchema.parse({
  date: '2026-12-01',
  template: 'extreme_index',
  params: { extreme: 'max', tie: 'first' },
  function_name: 'maxIndex',
  bug_type: 'comparison',
  mutation: { operator: 'relax_comparison', node: 'n16', from: '>', to: '>=' },
  spec: SPEC,
  code: CODE,
  bug_line: 4,
  fix: FIX,
  pickable_lines: [2, 3, 4, 5, 8],
  tests: [
    { input: [[]], expected: 0, actual: 0 },
    { input: [[4]], expected: 0, actual: 0 },
    { input: [[3, 7, 2]], expected: 1, actual: 1 },
    { input: [[5, 1, 5]], expected: 0, actual: 2 },
    { input: [[1, 2, 3]], expected: 2, actual: 2 },
    { input: [[-2, -9, -2]], expected: 0, actual: 2 },
    { input: [[9, 8, 7, 6]], expected: 0, actual: 0 },
    { input: [[7, 3, 7, 1]], expected: 0, actual: 2 },
  ],
  visible_tests: VISIBLE,
  failing_test: { input: [[5, 1, 5]], expected: 0, actual: 2 },
  explanation: { steps: STEPS },
});

export const BH_PAYLOAD_BOOL: BugHuntPayload = payloadSchema.parse({
  date: '2026-12-01',
  template: 'any_where',
  params: { condition: 'gt' },
  function_name: 'anyAbove',
  bug_type: 'bad_initialization',
  mutation: { operator: 'flip_bool_init', node: 'n2', from: 'false', to: 'true' },
  spec: {
    es: 'Devuelve true si algún elemento de nums es mayor que k; si no, false.',
    en: 'Returns true if some element of nums is greater than k; otherwise false.',
  },
  code: {
    js: [
      'function anyAbove(nums, k) {',
      '  let found = true;',
      '  for (let i = 0; i < nums.length; i++) {',
      '    if (nums[i] > k) {',
      '      found = true;',
      '    }',
      '  }',
      '  return found;',
      '}',
    ].join('\n'),
    go: [
      'func anyAbove(nums []int, k int) bool {',
      '\tfound := true',
      '\tfor i := 0; i < len(nums); i++ {',
      '\t\tif nums[i] > k {',
      '\t\t\tfound = true',
      '\t\t}',
      '\t}',
      '\treturn found',
      '}',
    ].join('\n'),
    java: [
      'static boolean anyAbove(int[] nums, int k) {',
      '    boolean found = true;',
      '    for (int i = 0; i < nums.length; i++) {',
      '        if (nums[i] > k) {',
      '            found = true;',
      '        }',
      '    }',
      '    return found;',
      '}',
    ].join('\n'),
  },
  bug_line: 2,
  fix: { js: '  let found = false;', go: '\tfound := false', java: '    boolean found = false;' },
  pickable_lines: [2, 3, 4, 5, 8],
  tests: [
    { input: [[], 3], expected: false, actual: true },
    { input: [[5], 3], expected: true, actual: true },
    { input: [[1, 2], 3], expected: false, actual: true },
    { input: [[4, 9], 3], expected: true, actual: true },
    { input: [[-3, -1], -2], expected: true, actual: true },
    { input: [[1, 7, 2], 5], expected: true, actual: true },
    { input: [[0, 0, 0], 0], expected: false, actual: true },
    { input: [[2, 2, 2, 2], 1], expected: true, actual: true },
  ],
  visible_tests: [
    { input: [[5], 3], expected: true },
    { input: [[4, 9], 3], expected: true },
    { input: [[-3, -1], -2], expected: true },
  ],
  failing_test: { input: [[], 3], expected: false, actual: true },
  explanation: {
    steps: [
      {
        es: 'El valor inicial de found es true en lugar de false: la función arranca diciendo que ya encontró uno.',
        en: 'The initial value of found is true instead of false: the function starts out claiming it already found one.',
      },
      {
        es: 'Con [] y k = 3 no hay elementos, así que devuelve true en lugar de false. Los visibles tienen un elemento mayor que k y por eso pasan.',
        en: 'With [] and k = 3 there are no elements, so it returns true instead of false. The visible tests have an element greater than k, so they pass.',
      },
    ],
  },
});

const publicView = (locale: Locale) => ({
  function_name: 'maxIndex',
  spec: SPEC[locale],
  code: CODE,
  pickable_lines: [2, 3, 4, 5, 8],
  visible_tests: VISIBLE,
});
export const BH_PUBLIC_ES = publicView('es');
export const BH_PUBLIC_EN = publicView('en');

export const WON_JAVA = { language: 'java', line: 4 } as const;
export const LOST_GO = { language: 'go', line: 5 } as const;

const lineAt = (lang: CodeLanguage) => CODE[lang].split('\n')[3]!; // bug_line 4

/** `BugHuntResult` esperado de `BH_PAYLOAD` para un estado confirmado. */
export const bhResult = (
  s: { language: CodeLanguage; line: number },
  locale: Locale,
): BugHuntResult => ({
  win: s.line === 4,
  score: s.line === 4 ? 1 : 0,
  chosen_line: s.line,
  code_language: s.language,
  bug_line: 4,
  bug_type: 'comparison',
  function_name: 'maxIndex',
  failing_test: { input: [[5, 1, 5]], expected: 0, actual: 2 },
  fix: {
    js: { before: lineAt('js'), after: FIX.js },
    go: { before: lineAt('go'), after: FIX.go },
    java: { before: lineAt('java'), after: FIX.java },
  },
  explanation: { steps: STEPS.map((x) => x[locale]) },
});

/** `extra` tras una sola partida de `BH_PAYLOAD`. */
export const bhStats = (language: CodeLanguage, win: boolean) => ({
  by_language: { [language]: { played: 1, correct: win ? 1 : 0 } },
  by_bug_type: { comparison: { played: 1, correct: win ? 1 : 0 } },
});

// Lo que nunca puede aparecer en una respuesta previa al cierre.
// No se buscan '4' ni '>=': el número de línea está en pickable_lines y el código muestra el bug.
export const BH_FORBIDDEN = [
  '"bug_line":',
  '"bug_type":',
  '"mutation":',
  '"fix":',
  '"failing_test":',
  '"tests":',
  '"template":',
  '"params":',
  '"explanation":',
  '"actual":',
  '"steps":',
  '"chosen_line":',
  '"payload":',
  '"operator":',
  'extreme_index',
  'relax_comparison',
  'comparison',
  'nums[i] > nums[best]', // el fix (el código muestra '>=')
  '[5,1,5]',
  '[1,2,3]',
  '[-2,-9,-2]',
  '[9,8,7,6]',
  '[7,3,7,1]', // tests ocultos, con el que falla
  'La condición que decide',
  'The condition that decides',
  'Los tests visibles no repiten',
  'The visible tests never repeat',
];

export function seedBugHunt(dbs: Dbs, opts: Partial<Parameters<Dbs['insertChallenge']>[0]> = {}) {
  return dbs.insertChallenge({
    gameId: 'bug-hunt',
    date: '2026-12-01',
    number: 8,
    payload: BH_PAYLOAD,
    status: 'published',
    ...opts,
  });
}

export function seedBugHuntPlay(
  dbs: Dbs,
  challengeId: string,
  playerId: string,
  state: BugHuntState,
  extra: Record<string, unknown> = {},
) {
  return dbs.insertPlay({
    playerId,
    challengeId,
    gameId: 'bug-hunt',
    date: '2026-12-01',
    state,
    ...extra,
  });
}

export const MOVE = (language: string, line: unknown, challengeNumber = 8) => ({
  challenge_number: challengeNumber,
  move: { language, line },
});

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };

export const bhPost = (
  app: App,
  action: 'move' | 'start' | 'acknowledge-void',
  payload: unknown,
  player?: { id: string },
  query = '',
) =>
  app.request(`/api/games/bug-hunt/today/${action}${query}`, {
    method: 'POST',
    headers: { ...MUTATION_HEADERS, ...(player ? { Cookie: `nd_pid=${player.id}` } : {}) },
    body: JSON.stringify(payload),
  });

export const bhMove = (
  app: App,
  move: unknown,
  player?: { id: string },
  query = '',
  challengeNumber = 8,
) => bhPost(app, 'move', { challenge_number: challengeNumber, move }, player, query);

export const bhGet = (app: App, player?: { id: string }, query = '') =>
  app.request(`/api/games/bug-hunt/today${query}`, {
    headers: player ? { Cookie: `nd_pid=${player.id}` } : {},
  });

export const INVALID_SCHEMA: unknown[] = [
  { language: 'java', line: 0 },
  { language: 'java', line: -1 },
  { language: 'java', line: 4.5 },
  { language: 'java', line: '4' },
  { language: 'java', line: null },
  { language: 'rust', line: 4 },
  { language: 'JAVA', line: 4 },
  { language: 'java' },
  { line: 4 },
  {},
  { language: 'java', line: 4, extra: 1 },
  { language: 'java', option: 'o_n' },
  { guess: 'REACT' },
];

export const NON_PICKABLE = [1, 6, 7, 9, 10, 99];
