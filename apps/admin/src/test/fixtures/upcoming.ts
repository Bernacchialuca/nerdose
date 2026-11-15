import type { GameId } from '@nerdose/core';

import type {
  GenerationFailuresResponse,
  RegenerateResponse,
  UpcomingDay,
  UpcomingGame,
  UpcomingResponse,
} from '@/modules/upcoming/api/types';

export const REQ_ID = 'a0000000-0000-4000-8000-0000000000f1';
export const GG_05_NEW = 'e1000000-0000-4000-8000-000000001205';

export const DV = (dd: string) => `d0000000-0000-4000-8000-0000000012${dd}`;
export const GG = (dd: string) => `e0000000-0000-4000-8000-0000000012${dd}`;
export const TL = (dd: string) => `f0000000-0000-4000-8000-0000000012${dd}`;

export const DEVDLE_PAYLOAD = {
  term_id: '0b7e6f1c-3a52-4c1e-9f0a-1d2e3f4a5b6c',
  word: 'REACT',
  category: 'programming_languages',
  definition: {
    es: 'biblioteca de JavaScript para construir interfaces de usuario',
    en: 'JavaScript library for building user interfaces',
  },
  summary: {
    es: 'React es una biblioteca de código abierto mantenida por Meta.',
    en: 'React is a free and open-source front-end JavaScript library maintained by Meta.',
  },
};

const GRID_ROWS = [
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

const GG_IDS = {
  CACHE: '00000000-0000-4000-8000-000000000001',
  DOCKER: '00000000-0000-4000-8000-000000000002',
  KERNEL: '00000000-0000-4000-8000-000000000003',
  KUBERNETES: '00000000-0000-4000-8000-000000000004',
  MERGE: '00000000-0000-4000-8000-000000000005',
  OAUTH: '00000000-0000-4000-8000-000000000006',
  PYTHON: '00000000-0000-4000-8000-000000000007',
  REDIS: '00000000-0000-4000-8000-000000000008',
} as const;

const cell = (row: number, col: number) => ({ row, col });
const LINES: [
  keyof typeof GG_IDS,
  { row: number; col: number },
  { row: number; col: number },
  string,
][] = [
  ['CACHE', cell(0, 11), cell(4, 11), 'down'],
  ['DOCKER', cell(3, 2), cell(3, 7), 'right'],
  ['KERNEL', cell(2, 6), cell(7, 6), 'down'],
  ['KUBERNETES', cell(0, 9), cell(9, 9), 'down'],
  ['MERGE', cell(0, 0), cell(0, 4), 'right'],
  ['OAUTH', cell(5, 0), cell(9, 4), 'down_right'],
  ['PYTHON', cell(11, 0), cell(11, 5), 'right'],
  ['REDIS', cell(9, 1), cell(5, 5), 'up_right'],
];

export const GREP_GRID_PAYLOAD = {
  grid: GRID_ROWS.map((row) => [...row]),
  words: LINES.map(([w]) => ({
    term_id: GG_IDS[w],
    word: w,
    definition: { es: `definición de ${w}`, en: `definition of ${w}` },
  })),
  placements: LINES.map(([w, from, to, direction]) => ({
    term_id: GG_IDS[w],
    from,
    to,
    direction,
  })),
};

const tlItem = (
  id: string,
  opaque_id: string,
  label: string,
  category: string,
  event_date: string,
  date_precision: string,
) => ({
  fact_id: `00000000-0000-4000-8000-00000000000${id}`,
  opaque_id,
  label,
  category,
  event_date,
  date_precision,
  note: { es: `nota de ${label}`, en: `note on ${label}` },
});

export const TIMELINE_PAYLOAD = {
  prompt: {
    es: 'Ordená estos hitos del más antiguo al más reciente',
    en: 'Order these milestones from oldest to newest',
  },
  items: [
    tlItem('3', 'g2n5w3', 'Go', 'programming_languages', '2009-01-01', 'year'),
    tlItem('5', 'k1v3s8', 'Kubernetes', 'software_tools', '2014-06-01', 'month'),
    tlItem('1', 'p7k2m9', 'Python', 'programming_languages', '1991-02-20', 'day'),
    tlItem('4', 'd9r6t0', 'Docker', 'software_tools', '2013-03-20', 'day'),
    tlItem('2', 'j4x8q1', 'Java', 'programming_languages', '1995-05-23', 'day'),
  ],
  correct_order: ['p7k2m9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'k1v3s8'],
};

export const VERIFICATION = {
  ok: true,
  checks: [
    { name: 'solution_verified', ok: true },
    { name: 'translations_consistent', ok: true },
  ],
};

export const BIG_O_PAYLOAD = {
  recipe: 'nest(linear,doubling)',
  recipe_category: 'nested_loops',
  code: {
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
  },
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

// Valores de fixture con los formatos de `verify` (S-045); el log genérico no los interpreta.
export const BIG_O_VERIFICATION = {
  ok: true,
  checks: [
    { name: 'texts_bilingual', ok: true },
    { name: 'code_shape', ok: true },
    { name: 'variety_recipe', ok: true },
    { name: 'variety_answer', ok: true },
    { name: 'run_js', ok: true, detail: '120 ms' },
    { name: 'run_go', ok: true, detail: '310 ms' },
    { name: 'run_java', ok: true, detail: '540 ms' },
    {
      name: 'counts_agree',
      ok: true,
      detail: 'n=64,128,256,512,1024 counts=384,896,2048,4608,10240',
    },
    { name: 'counts_in_range', ok: true },
    { name: 'example_matches_run', ok: true, detail: 'n=1024 ops=10240' },
    { name: 'fit_quality', ok: true, detail: 'best=o_n_log_n cv=0.000' },
    { name: 'fit_unambiguous', ok: true, detail: 'best=o_n_log_n next=o_n ratio=12.4' },
    { name: 'fit_matches_answer', ok: true, detail: 'best=o_n_log_n answer=o_n_log_n' },
  ],
};

export const BUG_HUNT_PAYLOAD = {
  template: 'extreme_index',
  params: { extreme: 'max', tie: 'first' },
  function_name: 'maxIndex',
  bug_type: 'comparison',
  mutation: { operator: 'relax_comparison', node: 'n16', from: '>', to: '>=' },
  spec: {
    es: 'Devuelve el índice del mayor valor de nums; si el máximo se repite, el del primero. Con nums vacío devuelve 0.',
    en: 'Returns the index of the largest value in nums; if the maximum repeats, the first one. With an empty nums it returns 0.',
  },
  code: {
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
  },
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

// Valores de fixture con los formatos de `verify` (S-050); el log genérico no los interpreta.
export const BUG_HUNT_VERIFICATION = {
  ok: true,
  checks: [
    { name: 'texts_bilingual', ok: true },
    { name: 'code_shape', ok: true },
    { name: 'lines_consistent', ok: true },
    { name: 'tests_consistent', ok: true },
    { name: 'variety_combo', ok: true },
    { name: 'run_correct_js', ok: true, detail: '95 ms' },
    { name: 'run_correct_go', ok: true, detail: '280 ms' },
    { name: 'run_correct_java', ok: true, detail: '510 ms' },
    { name: 'run_mutant_js', ok: true, detail: '90 ms' },
    { name: 'run_mutant_go', ok: true, detail: '275 ms' },
    { name: 'run_mutant_java', ok: true, detail: '505 ms' },
    { name: 'correct_agrees', ok: true, detail: '8 tests' },
    { name: 'mutant_agrees', ok: true, detail: '8 tests' },
  ],
};

const VERIFICATIONS: Partial<Record<GameId, Record<string, unknown>>> = {
  'big-o': BIG_O_VERIFICATION,
  'bug-hunt': BUG_HUNT_VERIFICATION,
};

const PAYLOADS: Partial<Record<GameId, Record<string, unknown>>> = {
  'big-o': BIG_O_PAYLOAD,
  'bug-hunt': BUG_HUNT_PAYLOAD,
  devdle: DEVDLE_PAYLOAD,
  'grep-grid': GREP_GRID_PAYLOAD,
  timeline: TIMELINE_PAYLOAD,
};

const ID_OF: Partial<Record<GameId, (dd: string) => string>> = {
  devdle: DV,
  'grep-grid': GG,
  timeline: TL,
  'big-o': (dd) => `b0000000-0000-4000-8000-0000000012${dd}`,
  'bug-hunt': (dd) => `c1000000-0000-4000-8000-0000000012${dd}`,
};

export function approved(
  gameId: GameId,
  date: string,
  over: Partial<UpcomingGame> = {},
): UpcomingGame {
  const dd = date.slice(8);
  return {
    game_id: gameId,
    challenge: {
      id: (ID_OF[gameId] as (dd: string) => string)(dd),
      status: 'approved',
      payload: { ...(PAYLOADS[gameId] ?? {}), date },
      verification: VERIFICATIONS[gameId] ?? VERIFICATION,
      generator_version: '1.4.0',
      attempt: 0,
      rejected_items: [],
    },
    regeneration: null,
    failure: null,
    ...over,
  };
}

const GAMES: GameId[] = ['devdle', 'grep-grid', 'timeline'];

export function upcoming(
  overrides: Record<string, Partial<UpcomingGame>> = {},
  {
    from = '2026-12-02',
    firstNumber = 32,
    games = GAMES,
  }: { from?: string; firstNumber?: number; games?: GameId[] } = {},
): UpcomingResponse {
  const start = new Date(`${from}T00:00:00Z`);
  const days: UpcomingDay[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(start.getTime() + i * 86_400_000);
    const date = d.toISOString().slice(0, 10);
    return {
      date,
      number: firstNumber + i,
      games: games.map((g) => approved(g, date, overrides[`${date}:${g}`])),
    };
  });
  const active = days.flatMap((d) => d.games).filter((g) => g.failure !== null).length;
  return { days, active_failures: active };
}

const FAILURE = {
  challenge: null,
  regeneration: null,
  failure: { attempts: 20, last_reason: 'no_valid_term', updated_at: '2026-12-01T09:10:00Z' },
};

export const UPCOMING_OK = upcoming();
export const UPCOMING_FAILURE = upcoming({ '2026-12-02:devdle': FAILURE });
export const UPCOMING_EMPTY_CELL = upcoming({
  '2026-12-03:timeline': { challenge: null, regeneration: null, failure: null },
});
export const UPCOMING_PENDING = upcoming({
  '2026-12-05:grep-grid': {
    regeneration: {
      request_id: REQ_ID,
      status: 'pending',
      error: null,
      requested_at: '2026-12-01T14:02:00Z',
      processed_at: null,
    },
  },
});
export const UPCOMING_REGEN_FAILED = upcoming({
  '2026-12-05:grep-grid': {
    regeneration: {
      request_id: REQ_ID,
      status: 'failed',
      error: 'overlap_conflict',
      requested_at: '2026-12-01T14:02:00Z',
      processed_at: '2026-12-01T14:05:00Z',
    },
  },
});

function replaced(): UpcomingResponse {
  const base = upcoming();
  const day = base.days.find((d) => d.date === '2026-12-05');
  const game = day?.games.find((g) => g.game_id === 'grep-grid');
  if (game?.challenge) {
    game.challenge = { ...game.challenge, id: GG_05_NEW, attempt: 3 };
  }
  return base;
}
export const UPCOMING_REPLACED = replaced();

export const UPCOMING_REJECTED_ITEM = (() => {
  const base = upcoming();
  const game = base.days
    .find((d) => d.date === '2026-12-05')
    ?.games.find((g) => g.game_id === 'devdle');
  if (game?.challenge) {
    game.challenge = {
      ...game.challenge,
      rejected_items: [
        {
          kind: 'term',
          id: 'c0000000-0000-4000-8000-0000000000a1',
          label: 'CAP theorem',
          rejection_reason: 'definición incorrecta',
        },
      ],
    };
  }
  return base;
})();

export const UPCOMING_BIG_O = upcoming({}, { games: ['devdle', 'grep-grid', 'timeline', 'big-o'] });

export const UPCOMING_BIG_O_BAD_PAYLOAD = (() => {
  const base = upcoming({}, { games: ['devdle', 'grep-grid', 'timeline', 'big-o'] });
  const g = base.days
    .find((d) => d.date === '2026-12-02')
    ?.games.find((x) => x.game_id === 'big-o');
  if (g?.challenge) g.challenge.payload = { ...g.challenge.payload, trap_option: 'o_n_log_n' };
  return base;
})();

const ALL_GAMES: GameId[] = ['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt'];

export const UPCOMING_BUG_HUNT = upcoming({}, { games: ALL_GAMES });

export const UPCOMING_BUG_HUNT_BAD_PAYLOAD = (() => {
  const base = upcoming({}, { games: ALL_GAMES });
  const g = base.days
    .find((d) => d.date === '2026-12-02')
    ?.games.find((x) => x.game_id === 'bug-hunt');
  if (g?.challenge) g.challenge.payload = { ...g.challenge.payload, bug_type: 'typo' };
  return base;
})();

export const UPCOMING_BAD_PAYLOAD = (() => {
  const base = upcoming();
  const g = base.days[0]?.games.find((x) => x.game_id === 'devdle');
  if (g?.challenge) g.challenge.payload = { word: 'redis' };
  return base;
})();

export const FAILURES_ONE: GenerationFailuresResponse = {
  failures: [
    {
      game_id: 'devdle',
      date: '2026-12-02',
      attempts: 20,
      last_reason: 'no_valid_term',
      updated_at: '2026-12-01T09:10:00Z',
    },
  ],
};
export const FAILURES_NONE: GenerationFailuresResponse = { failures: [] };

export const REGEN_202: RegenerateResponse = {
  request_id: REQ_ID,
  status: 'pending',
  requested_at: '2026-12-01T14:02:00Z',
};
