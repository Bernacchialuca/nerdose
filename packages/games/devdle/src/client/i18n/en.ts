import type { Resources } from './es';

export const en: Resources = {
  title: 'Devdle',
  instructions: {
    meta: 'Challenge #{{number}} · ~2 min · one game per day',
    rulesTitle: 'how to play',
    step1: {
      kicker: '1 · Guess the term',
      body: "It's a tech term of 4 to 12 letters, the same for everyone today. You have 6 tries to find it.",
    },
    step2: {
      kicker: '2 · Read the clues',
      body: "Each letter tells you if it is in the right place (✓), in another place (~) or not in the word (✗). Besides the color, every clue has its symbol. Only terms from the list count: if it isn't there, you don't lose a try.",
    },
    step3: {
      kicker: '3 · Check the categories',
      body: "We show you the 8 categories of the bank —always the same ones— to guide you. Today's category, the definition and a summary are revealed at the end.",
    },
    countNotice:
      "The game doesn't count until you finish it. Winning or losing adds to your streak.",
    start: 'Start',
  },
  game: {
    title: 'Guess the term of the day',
    prompt: 'tech term · {{length}} letters · try {{attempt}} of {{max}}',
  },
  board: {
    label: 'Board: {{max}} tries of {{length}} letters',
    resultLabel: 'Your tries',
    row: 'Try {{n}}',
  },
  cell: {
    label: '{{letter}}, {{state}}',
    blank: 'square',
    correct: 'correct',
    present: 'in another position',
    absent: 'not in the word',
    written: 'typed',
    empty: 'empty',
  },
  keyboard: {
    label: 'Keyboard',
    enter: 'Submit',
    enterGlyph: 'ENTER',
    backspace: 'Delete',
  },
  key: {
    label: '{{letter}}, {{state}}',
    correct: 'correct',
    present: 'present',
    absent: 'ruled out',
  },
  hint: {
    onlyLetters: 'Only letters from A to Z.',
    missingLetters: 'Not enough letters: the term has {{length}}.',
    notInList: 'Not in the list. Try another term.',
    rateLimited: "You're going too fast. Wait a few seconds and try again.",
  },
  categories: {
    title: 'category hint',
    note: 'The category and the definition are revealed at the end.',
  },
  category: {
    programming_languages: 'programming languages',
    git: 'git',
    databases: 'databases',
    networking: 'networking',
    linux: 'linux',
    apis: 'apis',
    security: 'security',
    software_engineering: 'software engineering',
  },
  legend: {
    title: 'how to read the clues',
    correct: 'Right letter in the right place.',
    present: 'It is in the word, but in another position.',
    absent: 'Not in the word.',
  },
  result: {
    won: 'You won in {{score}}/{{max}}',
    lost: 'Not this time: X/{{max}}',
    lostDetail: 'Here is the word and its explanation.',
    wordTitle: 'word of the day',
    category: 'Category: {{category}}',
    summaryLabel: 'Summary',
    source: 'Source: Wikipedia (CC BY-SA)',
  },
  distribution: {
    title: 'your tries',
    streak: 'streak {{count}}',
    lossLabel: 'X',
    today: 'today',
    rowLabel: '{{label}}: {{count}} games',
    played: 'played',
    winRate: '{{value}}%',
    wins: 'wins',
  },
};
