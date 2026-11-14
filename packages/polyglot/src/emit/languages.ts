export const LANGUAGES = ['js', 'go', 'java'] as const;

export type Language = (typeof LANGUAGES)[number];
