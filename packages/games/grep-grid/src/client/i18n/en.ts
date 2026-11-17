import type { Resources } from './es';

export const en: Resources = {
  title: 'Grep Grid',
  instructions: {
    meta: 'Challenge #{{number}} · ~3 min · one game per day',
    rulesTitle: 'how to play',
    step1: {
      kicker: '1 · Find the 8 words',
      body: 'They are tech terms hidden in a 12×12 letter grid. The word list is in plain sight: what you have to find is where they are.',
    },
    step2: {
      kicker: '2 · Tap the first and last letter',
      body: 'Words run in 4 directions, always forward: → horizontal, ↓ vertical, ↘ and ↗ diagonal. Never backwards. The first tap marks the start and the second sends the selection; tapping the start again cancels it. If the selection is not a word from the list, nothing happens: just try again.',
    },
    step3: {
      kicker: '3 · No timer',
      body: 'There is no clock: the N/8 counter keeps score. You can give up whenever you want; the game closes with the words you found and we show you the missing ones, with their definition.',
    },
    countNotice:
      'The game does not count until you complete it. Finding all 8 or giving up adds to your streak.',
    start: 'Start',
  },
  game: {
    title: 'Find the {{total}} hidden words',
    prompt: "$ grep -o '[A-Z]*' today.txt",
    instruction: 'tap the first and last letter of each word',
  },
  counter: { value: '{{found}}/{{total}}', label: 'found' },
  board: {
    label: '12 by 12 grid',
    resultLabel: 'Final grid: {{found}} found and {{revealed}} revealed',
  },
  cell: {
    label: '{{letter}}, row {{row}}, column {{col}}, {{state}}',
    free: 'free',
    start: 'start',
    found: 'found',
    revealed: 'revealed',
    solution: 'part of the solution',
  },
  hint: {
    idle: '> tap the first letter of a word',
    start: '> now tap the last letter',
    found: '> {{word}} found · {{found}}/{{total}}',
    notAWord: "> that's not a word from the list, try again",
    invalidMove: '> words go from the first to the last letter, forward',
    rateLimited: "> you're going too fast. Wait a few seconds and try again",
    message: '> {{message}}',
  },
  words: {
    title: "today's words",
    letters: '{{count}} letters',
    foundSr: 'found',
    foundResult: '✓ found',
    revealed: "○ you didn't find it",
  },
  surrender: {
    button: 'Give up',
    title: 'Give up?',
    close: 'Close',
    body: "You're about to close the game with {{found}}/{{total}}. It counts for your streak and we'll show you the missing words. This can't be undone.",
    bodyNone:
      "You're about to close the game with 0/{{total}}. It still counts for your streak and we'll show you all {{total}} words. This can't be undone.",
    keepPlaying: 'Keep playing',
    confirm: 'Yes, give up',
    closing: 'Closing…',
  },
  preview: {
    boardLabel: 'Grid with the {{total}} words highlighted',
    wordsTitle: 'challenge words',
    wordsCount: '{{total}} words',
  },
  result: {
    won: '{{total}}/{{total}}: you found them all',
    gaveUp: 'You gave up with {{score}}/{{total}}',
    gaveUpDetail: 'These are the words you were missing.',
  },
  stats: {
    title: 'words',
    average: 'average {{value}} of {{total}}',
    perfect: '8/8 in {{value}} of games',
    none: "You haven't played this game yet.",
  },
};
