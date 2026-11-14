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
    comment: 'a single try · 1 point per correct position',
    lede: 'Oldest at the top, newest at the bottom. Drag each card or use the arrows.',
    listTitle: 'your order',
    axisBefore: 'before',
    axisAfter: 'after',
    rulesTitle: 'rules',
    streak: 'streak {{count}}',
    rule1: 'Five milestones from different categories. Dates are revealed when you confirm.',
    rule2: 'You get a single try. Each milestone in place scores 1 point.',
    rule3: 'At the end, each milestone shows its date and a bit of history.',
    unknownDate: '????',
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
  preview: {
    prompt: 'task: {{prompt}}',
  },
  result: {
    comment: 'task: from oldest to newest',
    won: 'Perfect order',
    verdict3: 'So close: just two milestones swapped',
    verdict2: 'Halfway there',
    verdict1: 'History is tricky',
    verdict0: 'History won today',
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
