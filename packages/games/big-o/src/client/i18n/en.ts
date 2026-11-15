import type { es } from './es';

type Shape<T> = { -readonly [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };

export const en: Shape<typeof es> = {
  title: 'Big O',
  instructions: {
    meta: 'Challenge #{{number}} · ~1 min · one game per day',
    rulesTitle: 'how to play',
    step1: {
      kicker: '1 · Read the code',
      body: "It's a function f(n) that counts its own operations. It opens in your preferred language and you can switch to JavaScript, Go or Java at any time: it's the same algorithm.",
    },
    step2: {
      kicker: '2 · Think about the worst case',
      body: 'How does the number of operations grow as n grows? Watch how each variable moves.',
    },
    step3: {
      kicker: '3 · Pick and confirm',
      body: "There are 8 options, from O(1) to O(n!), and a single attempt. When you confirm you'll see the answer and a step-by-step explanation, and the language you confirmed in becomes your preferred one.",
    },
    countNotice:
      "The game doesn't count until you confirm. If you leave before that, no option will be selected when you come back, but you keep your attempt.",
    start: 'Start',
  },
  question: {
    before: 'What is the time complexity (worst case) of ',
    after: '?',
  },
  code: {
    tabsLabel: 'Code language',
    regionLabel: 'Code of f(n) in {{language}}',
  },
  game: {
    comment: 'worst case · one attempt',
    optionsTitle: 'your answer',
    optionsLabel: 'Time complexity of f(n)',
    hint: {
      idle: '> pick one of the 8 options',
      selected: '> you picked {{option}}. You can change it until you confirm.',
      invalidMove:
        "> we couldn't record your answer. Pick an option and confirm again: you didn't lose your attempt.",
      rateLimited: "> you're going too fast. Wait a few seconds and try again.",
      message: '> {{message}}',
    },
    confirm: 'Confirm answer',
    confirming: 'Confirming…',
    confirmDisabled: 'Pick an option to confirm',
    rulesTitle: 'rules',
    rule1: 'Worst case: how operations grow as n grows.',
    rule2: 'One attempt: pick and confirm.',
    rule3: 'The language is just a view: the one open when you confirm becomes your preferred one.',
    help: 'With the keyboard: ← → arrows to switch language, Tab to the options, arrows to pick and Enter on "Confirm answer".',
  },
  result: {
    won: 'Correct: {{answer}}',
    lost: 'Incorrect: it was {{answer}}',
    lostDetail: 'You picked {{chosen}} in {{language}}. Step by step why, below.',
    optionsTitle: 'your answer · confirmed in {{language}}',
    correct: 'correct',
    yours: 'your answer',
    optionSr: {
      correctChosen: '{{option}}, correct, your answer',
      correct: '{{option}}, correct',
      wrongChosen: '{{option}}, your answer, incorrect',
    },
    whyComment: 'why',
    stepsTitle: 'Step by step',
    example: {
      title: 'in numbers, with n = {{n}}',
      ops: 'f({{n}}) counts {{ops}} operations',
      trap: 'with {{trap}} it would be {{trapOps}}',
    },
  },
  preview: {
    optionsTitle: 'answer',
    trap: 'trap',
    optionSr: {
      trap: '{{option}}, trap',
    },
  },
  stats: {
    title: 'correct by recipe category',
    count: '{{correct}} of {{played}}',
    none: "You haven't played this game yet.",
    categories: {
      simple_loops: 'simple loops',
      nested_loops: 'nested loops',
      recursion: 'recursion',
      divide_and_conquer: 'divide and conquer',
      binary_search: 'binary search',
    },
  },
};
