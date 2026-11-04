export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const CODE_LANGUAGES = ['js', 'go', 'java'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];
