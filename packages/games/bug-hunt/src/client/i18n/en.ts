import type { es } from './es';

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export const en: Widen<typeof es> = {
  title: 'Bug Hunt',
  instructions: {
    meta: 'Challenge #{{number}} · ~2 min · one game per day',
    rulesTitle: 'how to play',
    step1: {
      kicker: '1 · Read what it should do',
      body: "You get the spec of a short function and a few tests that pass. There's a hidden test that fails: that's where the bug is.",
    },
    step2: {
      kicker: '2 · Find the line',
      body: "The bug is on a single line. You can view the code in JavaScript, Go or Java at any time: it's the same function and the bug is on the same line. The signature and brace-only lines don't count.",
    },
    step3: {
      kicker: '3 · Pick and confirm',
      body: "You have a single attempt. When you confirm you'll see the failing test, the fix and why it fails, and the language you confirmed in becomes your preferred one.",
    },
    countNotice:
      "The game doesn't count until you confirm. If you leave before that, no line will be selected when you come back, but you keep your attempt.",
    start: 'Start',
  },
  question: 'Which line has the bug?',
  spec: { title: 'what it should do' },
  tests: {
    title: 'tests',
    datum: 'call → expected',
    passSr: '{{name}} of {{args}} returns {{expected}}, passes',
    hidden: '1 hidden test fails',
    note: 'The failing test is revealed when you confirm. The passing ones help you rule out lines.',
  },
  code: {
    tabsLabel: 'Code language',
    regionLabel: 'Code of {{name}} in {{language}}',
    linesLabel: 'Lines of {{name}} in {{language}}',
    lineLabel: 'Line {{line}}: {{code}}',
    chosenTag: 'your pick',
  },
  game: {
    comment: "one attempt · the signature and brace-only lines don't count",
    hint: {
      idle: '> tap the line where you think the bug is',
      selected: '> you picked line {{line}}. You can change it until you confirm.',
      invalidMove:
        "> we couldn't record that line. Pick one and confirm again: you didn't lose your attempt.",
      rateLimited: "> you're going too fast. Wait a few seconds and try again.",
      message: '> {{message}}',
    },
    confirm: 'Confirm line {{line}}',
    confirmIdle: 'Pick a line',
    confirming: 'Confirming…',
    languagesNote:
      "The bug is the same in all three languages: switching tabs doesn't change the answer.",
    rulesTitle: 'how to play',
    rule1: 'Read what the function should do and look at the tests.',
    rule2: 'Tap the line where you think the bug is.',
    rule3: {
      before: 'Confirm: you have ',
      strong: 'a single attempt',
      after: '. The language you have open becomes your preferred one.',
    },
    help: 'With the keyboard: ← → arrows to switch language, Tab to the code, ↑ ↓ arrows to move through the eligible lines, Space to pick and Enter on "Confirm line".',
  },
  result: {
    won: 'Bug found on line {{line}}',
    lost: 'The bug was on line {{bug}}, not line {{chosen}}',
    lostDetail:
      'You picked line {{chosen}} in {{language}}. Challenge completed: your streaks are still standing.',
    tag: { found: 'the bug was here', wrong: 'your pick' },
    failingTitle: 'the failing test',
    expected: 'expected',
    actual: 'got',
    fixTitle: 'the fix · line {{line}}',
    fixLabel: 'Fix for line {{line}} in {{language}}',
    whyTitle: 'Why it fails',
    bugType: 'type: {{type}}',
  },
  preview: { bugTag: 'bug line', mutation: 'mutation: {{from}} → {{to}}' },
  share: { found: 'bug found', missed: 'it got away' },
  stats: {
    byLanguage: 'by language',
    byBugType: 'by bug type',
    count: '{{correct}} of {{played}}',
    none: "You haven't played this game yet.",
  },
};
