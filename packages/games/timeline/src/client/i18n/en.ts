import type { es } from './es';

type Shape<T> = { -readonly [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };

export const en: Shape<typeof es> = {
  title: 'Tech Timeline',
  categories: {
    programming_languages: 'programming languages',
    frameworks: 'frameworks',
    companies: 'companies',
    operating_systems: 'operating systems',
    hardware: 'hardware',
    video_games: 'video games',
    databases: 'databases',
    software_tools: 'software and tools',
  },
  instructions: {
    meta: 'Challenge #{{number}} · ~1 min · one game per day',
    rulesTitle: 'how to play',
    step1: {
      kicker: '1 · Look at the 5 milestones',
      body: 'They are facts from tech history across different categories (languages, frameworks, companies…), shuffled and without dates.',
    },
    step2: {
      kicker: '2 · Put them in order',
      body: 'From oldest to newest. Drag each row by its handle ⠿, use the ↑ ↓ buttons, or with the keyboard: Space to pick up a milestone, arrow keys to move it, Space to drop it and Escape to cancel.',
    },
    step3: {
      kicker: '3 · Confirm',
      body: 'You get a single try. When you are happy with the order, tap “Confirm order”: you will see the dates, a note on each milestone and how many positions you got right.',
    },
    countNotice:
      'The game does not count until you confirm. If you leave before, the milestones start shuffled again when you come back.',
    start: 'Start',
  },
  game: {
    comment: 'task: from oldest to newest · a single try',
    listTitle: 'your order',
    help: 'Drag each row by its handle ⠿ or use ↑ ↓. With the keyboard: Space to pick up a milestone, arrow keys to move it, Space to drop it and Escape to put it back.',
    confirm: 'Confirm order',
    confirming: 'Confirming…',
  },
  row: {
    handle: '{{label}}, position {{position}} of {{total}}',
    roleDescription: 'reorderable item',
    up: 'Move {{label}} up',
    down: 'Move {{label}} down',
  },
  dnd: {
    instructions:
      'To pick up a milestone, press Space or Enter. Move it with the up and down arrow keys. Press Space or Enter to drop it, or Escape to put it back.',
    start: 'Picked up {{label}}, position {{position}} of {{total}}.',
    over: '{{label}}, position {{position}} of {{total}}.',
    end: 'Dropped {{label}} at position {{position}} of {{total}}.',
    cancel: '{{label}} went back to position {{position}} of {{total}}.',
  },
  hint: {
    over: '> {{label}}, position {{position}} of {{total}}',
    moved: '> you moved {{label}} to position {{position}} of {{total}}',
    invalidMove: '> we could not save that order. Check it and confirm again',
    rateLimited: '> you are going too fast. Wait a few seconds and try again',
    message: '> {{message}}',
  },
  result: {
    comment: 'task: from oldest to newest',
    won: 'Perfect order',
    partial: '{{score}} of {{total}} in place',
    zero: 'None in place this time',
    scoreUnitTop: 'positions',
    scoreUnitBottom: 'correct',
    yourOrder: 'your order',
    correctOrder: 'correct order',
    ok: '✓ right',
    goesIn: '✗ goes {{position}}°',
    rowOk: '{{label}}, position {{position}}: right',
    rowWrong: '{{label}}, position {{position}}: misplaced, goes {{correct}}°',
  },
};
