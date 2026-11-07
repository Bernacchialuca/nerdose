export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const CODE_LANGUAGES = ['js', 'go', 'java'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const TERM_CATEGORIES = [
  'programming_languages',
  'git',
  'databases',
  'networking',
  'linux',
  'apis',
  'security',
  'software_engineering',
] as const;
export type TermCategory = (typeof TERM_CATEGORIES)[number];
