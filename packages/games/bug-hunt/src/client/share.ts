import type { Locale } from '@nerdose/core';

import { LANGUAGE_LABEL } from '../shared/labels';

import { parseResult } from './parse';
import { translatorFor } from './translate';

/**
 * Never includes the solution (line, bug type, test); the text follows the active locale (default
 * `es`). The host appends the site.
 */
export function share(result: unknown, number: number, locale: Locale = 'es'): string {
  const r = parseResult(result);
  const t = translatorFor(locale);
  return [
    `🐛 Bug Hunt #${number} · ${LANGUAGE_LABEL[r.code_language]}`,
    `${r.win ? '🟩' : '🟥'} ${t(r.win ? 'share.found' : 'share.missed')}`,
  ].join('\n');
}
