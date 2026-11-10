import {
  payloadSchema,
  stateSchema,
  type GrepGridPayload,
  type GrepGridState,
} from '@nerdose/game-grep-grid/definition';

import { MUTATION_HEADERS } from './app';
import type { useDatabases } from './db';

type Dbs = ReturnType<typeof useDatabases>;
type Cell = { row: number; col: number };
type Direction = 'right' | 'down' | 'down_right' | 'up_right';

export const GG_ROWS = [
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

export const GG_ID = {
  CACHE: '00000000-0000-4000-8000-000000000001',
  DOCKER: '00000000-0000-4000-8000-000000000002',
  KERNEL: '00000000-0000-4000-8000-000000000003',
  KUBERNETES: '00000000-0000-4000-8000-000000000004',
  MERGE: '00000000-0000-4000-8000-000000000005',
  OAUTH: '00000000-0000-4000-8000-000000000006',
  PYTHON: '00000000-0000-4000-8000-000000000007',
  REDIS: '00000000-0000-4000-8000-000000000008',
} as const;

export type GGWord = keyof typeof GG_ID;

const c = (row: number, col: number): Cell => ({ row, col });

const LINES: [GGWord, Cell, Cell, Direction][] = [
  ['CACHE', c(0, 11), c(4, 11), 'down'],
  ['DOCKER', c(3, 2), c(3, 7), 'right'],
  ['KERNEL', c(2, 6), c(7, 6), 'down'],
  ['KUBERNETES', c(0, 9), c(9, 9), 'down'],
  ['MERGE', c(0, 0), c(0, 4), 'right'],
  ['OAUTH', c(5, 0), c(9, 4), 'down_right'],
  ['PYTHON', c(11, 0), c(11, 5), 'right'],
  ['REDIS', c(9, 1), c(5, 5), 'up_right'],
];

export const defEs = (w: GGWord) => `definición de ${w}`;
export const defEn = (w: GGWord) => `definition of ${w}`;

// Falla en el import si la fixture queda mal formada.
export const GG_PAYLOAD: GrepGridPayload = payloadSchema.parse({
  date: '2026-12-01',
  grid: GG_ROWS.map((row) => [...row]),
  words: LINES.map(([w]) => ({
    term_id: GG_ID[w],
    word: w,
    definition: { es: defEs(w), en: defEn(w) },
  })),
  placements: LINES.map(([w, from, to, direction]) => ({
    term_id: GG_ID[w],
    from,
    to,
    direction,
  })),
});

export const GG_WORDS: GGWord[] = LINES.map(([w]) => w);

const line = (w: GGWord) => LINES.find(([name]) => name === w)!;

export function cellsOf(w: GGWord): Cell[] {
  const [, from, to] = line(w);
  const dRow = Math.sign(to.row - from.row);
  const dCol = Math.sign(to.col - from.col);
  const n = Math.max(Math.abs(to.row - from.row), Math.abs(to.col - from.col)) + 1;
  return Array.from({ length: n }, (_, i) => c(from.row + dRow * i, from.col + dCol * i));
}

export const selectWord = (w: GGWord) => {
  const [, from, to] = line(w);
  return { type: 'select' as const, from, to };
};

export const found = (...ws: GGWord[]): GrepGridState =>
  stateSchema.parse({
    found_words: ws.map((w) => ({ term_id: GG_ID[w], cells: cellsOf(w) })),
    gave_up: false,
  });

export const SEVEN: GGWord[] = [
  'CACHE',
  'DOCKER',
  'KERNEL',
  'KUBERNETES',
  'MERGE',
  'OAUTH',
  'REDIS',
];

export const INITIAL_EXTRA = {
  words_found: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 },
};

export function seedGrepGrid(
  dbs: Dbs,
  opts: Parameters<Dbs['insertChallenge']>[0] extends infer T ? Partial<T> : never = {},
) {
  return dbs.insertChallenge({
    gameId: 'grep-grid',
    date: '2026-12-01',
    number: 8,
    payload: GG_PAYLOAD,
    status: 'published',
    ...opts,
  });
}

export function seedGrepGridPlay(
  dbs: Dbs,
  challengeId: string,
  playerId: string,
  state: GrepGridState,
  extra: Record<string, unknown> = {},
) {
  return dbs.insertPlay({
    playerId,
    challengeId,
    gameId: 'grep-grid',
    date: '2026-12-01',
    state,
    ...extra,
  });
}

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };

export const ggPost = (
  app: App,
  action: 'move' | 'start',
  payload: unknown,
  player?: { id: string },
  query = '',
) =>
  app.request(`/api/games/grep-grid/today/${action}${query}`, {
    method: 'POST',
    headers: { ...MUTATION_HEADERS, ...(player ? { Cookie: `nd_pid=${player.id}` } : {}) },
    body: JSON.stringify(payload),
  });

export const ggMove = (
  app: App,
  move: unknown,
  player?: { id: string },
  query = '',
  challengeNumber = 8,
) => ggPost(app, 'move', { challenge_number: challengeNumber, move }, player, query);

export const ggGet = (app: App, player?: { id: string }, query = '') =>
  app.request(`/api/games/grep-grid/today${query}`, {
    headers: player ? { Cookie: `nd_pid=${player.id}` } : {},
  });

export const ggResultWords = (locale: 'es' | 'en', foundWords: GGWord[]) =>
  GG_WORDS.map((w) => ({
    term_id: GG_ID[w],
    word: w,
    definition: locale === 'es' ? defEs(w) : defEn(w),
    found: foundWords.includes(w),
    cells: cellsOf(w),
  }));
