import type { Locale } from '@nerdose/core';

import { i18n } from './i18n';
import type { Translate } from './types';

/** Production translator for `Preview`: dotted keys, `{{var}}`, returns the key when missing (never throws in the admin UI). */
export function translatorFor(language: Locale): Translate {
  return (key, options = {}) => {
    let current: unknown = i18n.resources[language];
    for (const part of key.split('.')) {
      if (typeof current !== 'object' || current === null || !(part in current)) return key;
      current = (current as Record<string, unknown>)[part];
    }
    if (typeof current !== 'string') return key;
    return current.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options[name] ?? ''));
  };
}
