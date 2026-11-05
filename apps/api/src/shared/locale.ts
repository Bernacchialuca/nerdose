import { LOCALES, type Locale } from '@nerdose/core';

const DEFAULT_LOCALE: Locale = 'es';

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

export function pickLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const candidates = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.split(';');
      const qParam = params.map((p) => p.trim()).find((p) => p.toLowerCase().startsWith('q='));
      const q = qParam === undefined ? 1 : Number.parseFloat(qParam.slice(2));
      const primary = tag.trim().split('-')[0]?.toLowerCase() ?? '';
      return { primary, q: Number.isNaN(q) ? 0 : q, index };
    })
    .filter((c) => c.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return (
    (candidates.find((c) => isLocale(c.primary))?.primary as Locale | undefined) ?? DEFAULT_LOCALE
  );
}

export function resolveLocale(input: {
  lang?: string;
  playerLocale?: Locale;
  acceptLanguage?: string;
}): Locale {
  if (isLocale(input.lang)) return input.lang;
  if (input.playerLocale) return input.playerLocale;
  return pickLocale(input.acceptLanguage);
}
