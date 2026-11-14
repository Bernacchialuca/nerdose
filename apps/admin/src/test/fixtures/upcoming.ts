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

const PAYLOADS: Partial<Record<GameId, Record<string, unknown>>> = {
  devdle: DEVDLE_PAYLOAD,
  'grep-grid': GREP_GRID_PAYLOAD,
  timeline: TIMELINE_PAYLOAD,
};

const ID_OF: Partial<Record<GameId, (dd: string) => string>> = {
  devdle: DV,
  'grep-grid': GG,
  timeline: TL,
  'big-o': (dd) => `b0000000-0000-4000-8000-0000000012${dd}`,
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
      verification: VERIFICATION,
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

export const UPCOMING_BIG_O = (() => {
  const base = upcoming({}, { games: ['devdle', 'grep-grid', 'timeline', 'big-o'] });
  for (const day of base.days) {
    const g = day.games.find((x) => x.game_id === 'big-o');
    if (g?.challenge) {
      g.challenge.payload = {
        answer: 'O(n log n)',
        explanation: { es: 'ordena con mezcla', en: 'merge sort' },
        date: day.date,
      };
    }
  }
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
