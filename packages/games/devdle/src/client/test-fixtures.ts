import type { DevdleGuess } from '../definition/schemas';

const ALL_CATEGORIES = [
  'programming_languages',
  'git',
  'databases',
  'networking',
  'linux',
  'apis',
  'security',
  'software_engineering',
] as const;

export const PUBLIC_VIEW_6 = { length: 6, possible_categories: [...ALL_CATEGORIES] };
export const PUBLIC_VIEW_12 = { ...PUBLIC_VIEW_6, length: 12 };

export const GUESS_BRANCH: DevdleGuess = {
  guess: 'BRANCH',
  marks: ['absent', 'present', 'present', 'absent', 'absent', 'absent'],
};
export const GUESS_SERVER: DevdleGuess = {
  guess: 'SERVER',
  marks: ['present', 'absent', 'correct', 'absent', 'correct', 'correct'],
};
export const GUESS_PARSER: DevdleGuess = {
  guess: 'PARSER',
  marks: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
};

export const STATE_2 = { guesses: [GUESS_BRANCH, GUESS_SERVER] };

export const RESULT_WIN = {
  win: true,
  score: 3,
  word: 'PARSER',
  category: 'software_engineering',
  definition: 'Programa que analiza una secuencia de texto según una gramática formal.',
  summary: 'Un analizador sintáctico es…',
  guesses: [GUESS_BRANCH, GUESS_SERVER, GUESS_PARSER],
};

export const RESULT_LOSS = {
  win: false,
  score: 6,
  word: 'PARSER',
  category: 'software_engineering',
  definition: 'Programa que analiza una secuencia de texto según una gramática formal.',
  summary: 'Un analizador sintáctico es…',
  guesses: [GUESS_BRANCH, GUESS_BRANCH, GUESS_BRANCH, GUESS_SERVER, GUESS_SERVER, GUESS_SERVER],
};

export const GAME_STATS = {
  game_id: 'devdle',
  current_streak: 3,
  max_streak: 7,
  played: 12,
  wins: 11,
  win_rate: 0.9166,
  extra: { guesses: { '1': 0, '2': 1, '3': 4, '4': 3, '5': 2, '6': 1 }, losses: 1 },
};

export const PREVIEW_PAYLOAD = {
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
  date: '2026-12-02',
};
