import type { MoveContext } from '@nerdose/core';

import type { Cell } from '../shared/geometry';
import { grepGrid } from './index';
import type { GrepGridFeedback, GrepGridMove, GrepGridPayload, GrepGridState } from './schemas';

export const GRID_ROWS = [
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

export const ID = {
  CACHE: '00000000-0000-4000-8000-000000000001',
  DOCKER: '00000000-0000-4000-8000-000000000002',
  KERNEL: '00000000-0000-4000-8000-000000000003',
  KUBERNETES: '00000000-0000-4000-8000-000000000004',
  MERGE: '00000000-0000-4000-8000-000000000005',
  OAUTH: '00000000-0000-4000-8000-000000000006',
  PYTHON: '00000000-0000-4000-8000-000000000007',
  REDIS: '00000000-0000-4000-8000-000000000008',
} as const;

const c = (row: number, col: number): Cell => ({ row, col });

const LINES: [keyof typeof ID, Cell, Cell, 'right' | 'down' | 'down_right' | 'up_right'][] = [
  ['CACHE', c(0, 11), c(4, 11), 'down'],
  ['DOCKER', c(3, 2), c(3, 7), 'right'],
  ['KERNEL', c(2, 6), c(7, 6), 'down'],
  ['KUBERNETES', c(0, 9), c(9, 9), 'down'],
  ['MERGE', c(0, 0), c(0, 4), 'right'],
  ['OAUTH', c(5, 0), c(9, 4), 'down_right'],
  ['PYTHON', c(11, 0), c(11, 5), 'right'],
  ['REDIS', c(9, 1), c(5, 5), 'up_right'],
];

export const PAYLOAD: GrepGridPayload = {
  date: '2026-12-02',
  grid: GRID_ROWS.map((row) => [...row]),
  words: LINES.map(([w]) => ({
    term_id: ID[w],
    word: w,
    definition: { es: `definición de ${w}`, en: `definition of ${w}` },
  })),
  placements: LINES.map(([w, from, to, direction]) => ({ term_id: ID[w], from, to, direction })),
};

export const GRID_DUPLICATE: string[][] = PAYLOAD.grid.map((row, i) =>
  i === 8 ? [...'VZETVMERGEVZ'] : [...row],
);

export const NOW = new Date('2026-12-02T10:00:00.000Z');
export const CTX_ES: MoveContext = { isValidWord: () => true, locale: 'es' };
export const CTX_EN: MoveContext = { isValidWord: () => true, locale: 'en' };
export const S0: GrepGridState = { found_words: [], gave_up: false };

export const select = (from: Cell, to: Cell): GrepGridMove => ({ type: 'select', from, to });

export const cellsOf = (w: keyof typeof ID): Cell[] => {
  const [, from, to] = LINES.find(([name]) => name === w) as (typeof LINES)[number];
  const cells: Cell[] = [];
  const dRow = Math.sign(to.row - from.row);
  const dCol = Math.sign(to.col - from.col);
  const n = Math.max(Math.abs(to.row - from.row), Math.abs(to.col - from.col)) + 1;
  for (let i = 0; i < n; i++) cells.push(c(from.row + dRow * i, from.col + dCol * i));
  return cells;
};

export const selectWord = (w: keyof typeof ID): GrepGridMove => {
  const [, from, to] = LINES.find(([name]) => name === w) as (typeof LINES)[number];
  return select(from, to);
};

/** Aplica las jugadas en orden; devuelve el último estado y el último feedback. */
export function playAll(moves: GrepGridMove[], ctx: MoveContext = CTX_ES) {
  let state = S0;
  let feedback: GrepGridFeedback | undefined;
  for (const m of moves) {
    const r = grepGrid.applyMove(PAYLOAD, state, m, NOW, ctx);
    if ('error' in r) throw new Error(r.error);
    state = r.state;
    feedback = r.feedback;
  }
  return { state, feedback };
}

export const WORD_ORDER = LINES.map(([w]) => w);
