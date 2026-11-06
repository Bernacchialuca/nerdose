import type { es } from './es';

type Resources = typeof es;

export const en: Resources = {
  shell: { brand: 'nerdose', title: 'nerdose' },
  errors: { title: 'Something went wrong', retry: 'Try again' },
  nav: {
    label: 'Main navigation',
    games: './games',
    stats: './stats',
    about: './about',
  },
  language: { label: 'Language', es: 'ES', en: 'EN' },
  cookies: {
    title: 'Enable cookies to play',
    detail:
      "Without cookies we can't save your game. The catalog, stats and “About” are still available.",
  },
  footer: {
    tagline: 'nerdose — one platform, many challenges.',
    exit: 'exit 0',
  },
  about: {
    documentTitle: 'About · nerdose',
    title: 'About nerdose',
    intro:
      'Nerdose is a platform of daily minigames about programming and technology: a new challenge every day in each game, the same for everyone, no sign-up, in Spanish and English.',
    games: {
      title: 'The games',
      body: 'Every game has a new challenge each day, the same for everyone. Rounds take 1 to 3 minutes and every game is about programming and technology.',
      link: 'See the games',
    },
    streaks: {
      title: 'How streaks work',
      body: "Completing a challenge, whether you win or lose, adds to your streak. A day without a challenge is neutral: it neither adds nor breaks it. A voided challenge doesn't affect you.",
    },
    attribution: {
      title: 'Data and attribution',
      body: 'Some of the content comes from <wikipedia>Wikipedia</wikipedia> and <wikidata>Wikidata</wikidata> and is used under the <license>CC BY-SA 4.0</license> license.',
    },
    newTab: '(opens in a new tab)',
    privacy: {
      title: 'Privacy',
      body: "There is no account or sign-up. We use a single functional cookie to keep your progress: it stores no personal data, we don't use it to track you and there are no third-party cookies. That's why we don't show you a cookie banner.",
    },
    back: 'Back to the games',
  },
  notFound: {
    documentTitle: 'Page not found · nerdose',
    title: '404 · page not found',
    message:
      "This address doesn't exist on nerdose. Today's challenges are waiting for you on the home page.",
    back: 'Back to the games',
  },
  catalog: {
    title: 'A daily dose of <accent>nerdiness</accent>.',
    subtitle: 'Mini-games for developers and tech-curious folks. A new challenge every day, the same for everyone. Two minutes, something learned, a streak to keep.',
    howItWorks: 'How does it work?',
    hero: {
      continue: 'Keep playing',
      start: 'Start playing',
      browse: 'See the games',
      prompt: '$ nerdose --today',
      date: '// {{date}}',
    },
    challenges: { title: "Today's challenges" },
    terminal: {
      label: "Today's progress",
      title: '~/today — progress.log',
      command: '$ nerdose status',
      status: {
        done: 'completed',
        notPlayed: 'not played',
        inProgress: 'in progress',
        none: 'no challenge',
        voided: 'voided',
        soon: 'coming soon',
        noSession: 'no session',
      },
      streakLabel: 'global streak',
      streakValue_one: '{{count}} day · best {{max}}',
      streakValue_other: '{{count}} days · best {{max}}',
      streakUnknown: '— no data',
      countdown: 'next challenge in',
    },
    challengeLabel: "Today's challenge",
    challengeNumber: '#{{number}}',
    streakPill: {
      label_one: 'Global streak: {{count}} day',
      label_other: 'Global streak: {{count}} days',
      labelUnknown: 'Global streak: no data',
      value_one: '{{count}} day',
      value_other: '{{count}} days',
      unknown: '—',
    },
    progress: {
      completed: '{{completed}} of {{total}} completed today',
      completedWithChallenge: '{{completed}} of {{total}} with a challenge completed',
      noChallenges: 'No challenges published today',
      beforeLaunch: 'The first challenge is coming soon',
      noSession: "No session: we can't show your progress",
      unavailable: "We couldn't start your session. Reload in a few minutes to play.",
    },
    loading: "Loading today's challenges…",
    error: "We couldn't load today's games. Check your connection and try again.",
    card: {
      minutes: '~{{count}} min',
      untimed: 'no timer',
      streak: 'streak {{count}}',
      status: {
        notPlayed: 'not played',
        inProgress: 'in progress',
        completed: 'completed',
        none: 'no challenge today',
        voided: 'voided',
        soon: 'coming soon',
        noSession: 'no session',
      },
      neutral: "doesn't affect your streak",
      cta: {
        play: 'Play',
        continue: 'Keep playing',
        result: 'See result',
        none: 'No challenge today',
        soon: 'Coming soon',
      },
    },
    summary: {
      title: 'Your progress',
      empty: 'No data yet. Complete a challenge and your streak will show up here.',
      noChallenges: 'No data yet. When there are challenges, your streak will show up here.',
      beforeLaunch: 'No data yet. When the challenges start, your streak will show up here.',
      noSession: "Without a session there's no progress to show. Enable cookies and reload.",
      unavailable: "Without a session there's no progress to show. Reload in a few minutes.",
    },
    placeholder: {
      command: '$ git checkout -b',
      branch: 'next-game',
      body: 'More challenges on the way. Each new game adds its own streak.',
      chip: 'coming soon',
    },
    progressPanel: {
      label: 'global streak',
      unit_one: 'day',
      unit_other: 'days',
      unitSuffix_one: 'in a row',
      unitSuffix_other: 'in a row',
      unitUnknown: 'no data',
      record: 'best streak',
    },
    how: {
      title: 'How it works',
      steps: {
        '1': {
          kicker: '01 · every day',
          body: "Each game drops a new challenge at 00:00 UTC. It's the same for everyone.",
        },
        '2': {
          kicker: '02 · its own rules',
          body: 'Each game has its own mechanics, tries and scoring.',
        },
        '3': {
          kicker: '03 · you learn something',
          body: 'When you finish, every challenge explains the answer and its context.',
        },
        '4': {
          kicker: '04 · share without spoilers',
          body: 'Copy your result as little squares and paste it anywhere.',
        },
      },
    },
    stats: 'see stats',
  },
  games: {
    devdle: { name: 'Devdle', description: 'Guess the tech term in 6 tries' },
    'grep-grid': { name: 'Grep Grid', description: 'Find 8 words in the grid' },
    timeline: { name: 'Tech Timeline', description: 'Put 5 tech milestones in order' },
    'big-o': { name: 'Big O', description: 'Pick the time complexity' },
    'bug-hunt': { name: 'Bug Hunt', description: 'Find the line with the bug' },
  },
};
