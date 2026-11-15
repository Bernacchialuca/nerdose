import type { MoveContext } from '@nerdose/core';

import type { BugHuntPayload, BugHuntState } from './schemas';

export const CODE_MAX_INDEX = {
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

export const SPEC_MAX_INDEX = {
  es: 'Devuelve el índice del mayor valor de nums; si el máximo se repite, el del primero. Con nums vacío devuelve 0.',
  en: 'Returns the index of the largest value in nums; if the maximum repeats, the first one. With an empty nums it returns 0.',
};

export const PAYLOAD: BugHuntPayload = {
  date: '2026-11-20',
  template: 'extreme_index',
  params: { extreme: 'max', tie: 'first' },
  function_name: 'maxIndex',
  bug_type: 'comparison',
  mutation: { operator: 'relax_comparison', node: 'n16', from: '>', to: '>=' },
  spec: SPEC_MAX_INDEX,
  code: CODE_MAX_INDEX,
  bug_line: 4,
  fix: {
    js: '    if (nums[i] > nums[best]) {',
    go: '\t\tif nums[i] > nums[best] {',
    java: '        if (nums[i] > nums[best]) {',
  },
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
  visible_tests: [
    { input: [[]], expected: 0 },
    { input: [[4]], expected: 0 },
    { input: [[3, 7, 2]], expected: 1 },
  ],
  failing_test: { input: [[5, 1, 5]], expected: 0, actual: 2 },
  explanation: {
    steps: [
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
    ],
  },
};

export const CODE_ANY_ABOVE = {
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
};

export const PAYLOAD_BOOL: BugHuntPayload = {
  date: '2026-11-21',
  template: 'any_where',
  params: { condition: 'gt' },
  function_name: 'anyAbove',
  bug_type: 'bad_initialization',
  mutation: { operator: 'flip_bool_init', node: 'n2', from: 'false', to: 'true' },
  spec: {
    es: 'Devuelve true si algún elemento de nums es mayor que k; si no, false.',
    en: 'Returns true if some element of nums is greater than k; otherwise false.',
  },
  code: CODE_ANY_ABOVE,
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
};

export const NOW = new Date('2026-11-20T10:00:00.000Z');
export const CTX_ES: MoveContext = { isValidWord: () => true, locale: 'es' };
export const CTX_EN: MoveContext = { isValidWord: () => true, locale: 'en' };
export const S0: BugHuntState = {};
export const WON_JAVA: BugHuntState = { language: 'java', line: 4 };
export const LOST_GO: BugHuntState = { language: 'go', line: 5 };
export const WON_BOOL_JS: BugHuntState = { language: 'js', line: 2 };
/** Lines of `PAYLOAD` outside `pickable_lines`: signature (1), brace-only lines (6, 7, 9) and out of the code (10, 99). */
export const NON_PICKABLE = [1, 6, 7, 9, 10, 99];
