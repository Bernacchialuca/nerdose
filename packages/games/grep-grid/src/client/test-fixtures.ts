import { cellsOf, GRID_ROWS, ID } from '../definition/test-fixtures';

export { cellsOf, GRID_ROWS, ID };

export type WordName = keyof typeof ID;
export const WORD_NAMES = [
  'CACHE',
  'DOCKER',
  'KERNEL',
  'KUBERNETES',
  'MERGE',
  'OAUTH',
  'PYTHON',
  'REDIS',
] as const satisfies readonly WordName[];

export const GRID = GRID_ROWS.map((r) => [...r]);

const publicWords = (defined: readonly WordName[] = [], lang = 'definición de') =>
  WORD_NAMES.map((w) => ({
    term_id: ID[w],
    word: w,
    ...(defined.includes(w) ? { definition: `${lang} ${w}` } : {}),
  }));

export const PUBLIC_VIEW_0 = { grid: GRID, words: publicWords() };
export const PUBLIC_VIEW_3 = { grid: GRID, words: publicWords(['MERGE', 'CACHE', 'PYTHON']) };
export const publicViewEn = (defined: readonly WordName[]) => ({
  grid: GRID,
  words: publicWords(defined, 'definition of'),
});

export const STATE_0 = { found_words: [], gave_up: false };
const found = (w: WordName) => ({ term_id: ID[w], cells: cellsOf(w) });
export const STATE_3 = {
  found_words: (['MERGE', 'CACHE', 'PYTHON'] as const).map(found),
  gave_up: false,
};
export const STATE_4 = { found_words: [...STATE_3.found_words, found('DOCKER')], gave_up: false };

export const FEEDBACK_DOCKER = {
  found: true as const,
  term_id: ID.DOCKER,
  word: 'DOCKER',
  definition: 'definición de DOCKER',
  cells: cellsOf('DOCKER'),
};
export const FEEDBACK_NOT_A_WORD = { found: false as const, reason: 'not_a_word' as const };
export const FEEDBACK_ALREADY = { found: false as const, reason: 'already_found' as const };

const resultWords = (foundSet: readonly WordName[], lang = 'definición de') =>
  WORD_NAMES.map((w) => ({
    term_id: ID[w],
    word: w,
    definition: `${lang} ${w}`,
    found: foundSet.includes(w),
    cells: cellsOf(w),
  }));

export const RESULT_WIN = { win: true, score: 8, gave_up: false, words: resultWords(WORD_NAMES) };
export const GAVE_UP_5_FOUND = ['CACHE', 'DOCKER', 'KERNEL', 'MERGE', 'PYTHON'] as const;
export const RESULT_GAVE_UP_5 = {
  win: false,
  score: 5,
  gave_up: true,
  words: resultWords(GAVE_UP_5_FOUND),
};
export const resultGaveUp5En = {
  ...RESULT_GAVE_UP_5,
  words: resultWords(GAVE_UP_5_FOUND, 'definition of'),
};
export const RESULT_GAVE_UP_0 = { win: false, score: 0, gave_up: true, words: resultWords([]) };
