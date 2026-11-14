import type { BigOOption, MoveContext } from '@nerdose/core';

import type { BigOPayload, BigOState } from './schemas';

export const CODE_NLOGN = {
  js: [
    'function f(n) {',
    '  let ops = 0;',
    '  for (let i = 0; i < n; i++) {',
    '    for (let j = 1; j < n; j *= 2) {',
    '      ops++;',
    '    }',
    '  }',
    '  return ops;',
    '}',
  ].join('\n'),
  go: [
    'func f(n int) int {',
    '\tops := 0',
    '\tfor i := 0; i < n; i++ {',
    '\t\tfor j := 1; j < n; j *= 2 {',
    '\t\t\tops++',
    '\t\t}',
    '\t}',
    '\treturn ops',
    '}',
  ].join('\n'),
  java: [
    'static int f(int n) {',
    '    int ops = 0;',
    '    for (int i = 0; i < n; i++) {',
    '        for (int j = 1; j < n; j *= 2) {',
    '            ops++;',
    '        }',
    '    }',
    '    return ops;',
    '}',
  ].join('\n'),
};

export const PAYLOAD: BigOPayload = {
  recipe: 'nest(linear,doubling)',
  recipe_category: 'nested_loops',
  code: CODE_NLOGN,
  answer: 'o_n_log_n',
  trap_option: 'o_n2',
  explanation: {
    steps: [
      { es: 'El loop externo corre n veces.', en: 'The outer loop runs n times.' },
      {
        es: 'El interno duplica j: log₂ n vueltas.',
        en: 'The inner loop doubles j: log₂ n iterations.',
      },
      {
        es: 'Anidados se multiplican: n × log n. Simplificado: O(n log n).',
        en: 'Nested loops multiply: n × log n. Simplified: O(n log n).',
      },
    ],
    line_notes: [
      { line: 3, text: { es: 'n veces', en: 'n times' } },
      { line: 4, text: { es: 'log n veces', en: 'log n times' } },
    ],
    tip: {
      es: 'Un loop interno que duplica su variable no es n.',
      en: 'An inner loop that doubles its variable is not n.',
    },
    example: { n: 1024, ops: 10240, trap_ops: 1048576 },
  },
};

export const PAYLOAD_RECURSION: BigOPayload = {
  recipe: 'double_recursion(n-1,n-2)',
  recipe_category: 'recursion',
  code: {
    js: [
      'function f(n) {',
      '  if (n < 2) {',
      '    return 1;',
      '  }',
      '  return f(n - 1) + f(n - 2);',
      '}',
    ].join('\n'),
    go: [
      'func f(n int) int {',
      '\tif n < 2 {',
      '\t\treturn 1',
      '\t}',
      '\treturn f(n-1) + f(n-2)',
      '}',
    ].join('\n'),
    java: [
      'static int f(int n) {',
      '    if (n < 2) {',
      '        return 1;',
      '    }',
      '    return f(n - 1) + f(n - 2);',
      '}',
    ].join('\n'),
  },
  answer: 'o_2n',
  trap_option: null,
  explanation: {
    steps: [
      {
        es: 'Cada llamada con n ≥ 2 hace dos llamadas más: f(n - 1) y f(n - 2).',
        en: 'Each call with n ≥ 2 makes two more calls: f(n - 1) and f(n - 2).',
      },
      {
        es: 'El árbol de llamadas crece como 2ⁿ: O(2ⁿ). La cota exacta es φⁿ ≈ 1,618ⁿ, que está dentro de O(2ⁿ).',
        en: 'The call tree grows like 2ⁿ: O(2ⁿ). The tight bound is φⁿ ≈ 1.618ⁿ, which is within O(2ⁿ).',
      },
    ],
    line_notes: [{ line: 5, text: { es: 'dos llamadas por nivel', en: 'two calls per level' } }],
    tip: null,
    example: null,
  },
};

export const NOW = new Date('2026-11-15T10:00:00.000Z');
export const CTX_ES: MoveContext = { isValidWord: () => true, locale: 'es' };
export const CTX_EN: MoveContext = { isValidWord: () => true, locale: 'en' };
export const S0: BigOState = {};
export const WON_JAVA: BigOState = { language: 'java', option: 'o_n_log_n' };
export const LOST_GO: BigOState = { language: 'go', option: 'o_n2' };
export const withAnswer = (answer: BigOOption): BigOPayload => ({
  ...PAYLOAD,
  answer,
  trap_option: answer === 'o_n2' ? 'o_n' : 'o_n2',
});
