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
    domain: 'nerdose.dev',
    privacy:
      'No account: a single functional cookie keeps your progress, with no personal data or third-party cookies.',
    about: 'About',
  },
  about: {
    documentTitle: 'About · nerdose',
    title: 'About nerdose',
    intro:
      'nerdose is a daily game about programming and technology: five short minigames, a single challenge per day that is the same for everyone, no sign-up, in Spanish and English.',
    games: {
      title: 'The 5 games',
      body: 'Devdle: guess the term. Bug Hunt: find the line with the bug. Big O: pick the complexity. Tech Timeline: put the milestones in order. Grep Grid: find the 8 words, no timer.',
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
};
