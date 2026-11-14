import { BIG_O_OPTIONS, type BigOOption, type CodeLanguage } from '@nerdose/core';
import {
  payloadSchema,
  type BigOPayload,
  type BigOResult,
  type BigOState,
} from '@nerdose/game-big-o/definition';

import { MUTATION_HEADERS } from './app';
import type { useDatabases } from './db';

type Dbs = ReturnType<typeof useDatabases>;
type Locale = 'es' | 'en';

const CODE = {
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

const STEPS = [
  { es: 'El loop externo corre n veces.', en: 'The outer loop runs n times.' },
  {
    es: 'El interno duplica j: log₂ n vueltas.',
    en: 'The inner loop doubles j: log₂ n iterations.',
  },
  {
    es: 'Anidados se multiplican: n × log n. Simplificado: O(n log n).',
    en: 'Nested loops multiply: n × log n. Simplified: O(n log n).',
  },
];
const LINE_NOTES = [
  { line: 3, text: { es: 'n veces', en: 'n times' } },
  { line: 4, text: { es: 'log n veces', en: 'log n times' } },
];
const TIP = {
  es: 'Un loop interno que duplica su variable no es n.',
  en: 'An inner loop that doubles its variable is not n.',
};
const EXAMPLE = { n: 1024, ops: 10240, trap_ops: 1048576 };

// Falla en el import si la fixture queda mal formada.
export const BO_PAYLOAD: BigOPayload = payloadSchema.parse({
  recipe: 'nest(linear,doubling)',
  recipe_category: 'nested_loops',
  code: CODE,
  answer: 'o_n_log_n',
  trap_option: 'o_n2',
  explanation: { steps: STEPS, line_notes: LINE_NOTES, tip: TIP, example: EXAMPLE },
});

export const BO_PAYLOAD_RECURSION: BigOPayload = payloadSchema.parse({
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
});

export const BO_PUBLIC = { code: CODE, options: [...BIG_O_OPTIONS] };
export const WON_JAVA = { language: 'java', option: 'o_n_log_n' } as const;
export const LOST_GO = { language: 'go', option: 'o_n2' } as const;

/** `BigOResult` esperado de `BO_PAYLOAD` para un estado confirmado. */
export const boResult = (
  s: { language: CodeLanguage; option: BigOOption },
  locale: Locale,
): BigOResult => ({
  win: s.option === 'o_n_log_n',
  score: s.option === 'o_n_log_n' ? 1 : 0,
  answer: 'o_n_log_n',
  chosen_option: s.option,
  code_language: s.language,
  recipe_category: 'nested_loops',
  trap_option: 'o_n2',
  explanation: {
    steps: STEPS.map((x) => x[locale]),
    line_notes: LINE_NOTES.map((n) => ({ line: n.line, text: n.text[locale] })),
    tip: TIP[locale],
    example: EXAMPLE,
  },
});

/** `extra` tras una sola partida de `BO_PAYLOAD`. */
export const boStats = (win: boolean) => ({
  by_category: { nested_loops: { played: 1, correct: win ? 1 : 0 } },
});

// Lo que nunca puede aparecer en una respuesta previa al cierre. `o_n_log_n` no se busca: siempre está en `options`.
export const BO_FORBIDDEN = [
  '"answer":',
  '"trap_option":',
  '"explanation":',
  '"recipe":',
  '"recipe_category":',
  '"chosen_option":',
  '"steps":',
  '"line_notes":',
  '"tip":',
  '"payload":',
  'nest(linear,doubling)',
  'nested_loops',
  'El loop externo',
  'The outer loop',
  'log n veces',
  'log n times',
  'Un loop interno que duplica',
  'An inner loop that doubles',
  '10240',
  '1048576',
];

export function seedBigO(dbs: Dbs, opts: Partial<Parameters<Dbs['insertChallenge']>[0]> = {}) {
  return dbs.insertChallenge({
    gameId: 'big-o',
    date: '2026-12-01',
    number: 8,
    payload: BO_PAYLOAD,
    status: 'published',
    ...opts,
  });
}

export function seedBigOPlay(
  dbs: Dbs,
  challengeId: string,
  playerId: string,
  state: BigOState,
  extra: Record<string, unknown> = {},
) {
  return dbs.insertPlay({
    playerId,
    challengeId,
    gameId: 'big-o',
    date: '2026-12-01',
    state,
    ...extra,
  });
}

export const MOVE = (language: string, option: unknown, challengeNumber = 8) => ({
  challenge_number: challengeNumber,
  move: { language, option },
});

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };

export const boPost = (
  app: App,
  action: 'move' | 'start' | 'acknowledge-void',
  payload: unknown,
  player?: { id: string },
  query = '',
) =>
  app.request(`/api/games/big-o/today/${action}${query}`, {
    method: 'POST',
    headers: { ...MUTATION_HEADERS, ...(player ? { Cookie: `nd_pid=${player.id}` } : {}) },
    body: JSON.stringify(payload),
  });

export const boMove = (
  app: App,
  move: unknown,
  player?: { id: string },
  query = '',
  challengeNumber = 8,
) => boPost(app, 'move', { challenge_number: challengeNumber, move }, player, query);

export const boGet = (app: App, player?: { id: string }, query = '') =>
  app.request(`/api/games/big-o/today${query}`, {
    headers: player ? { Cookie: `nd_pid=${player.id}` } : {},
  });
