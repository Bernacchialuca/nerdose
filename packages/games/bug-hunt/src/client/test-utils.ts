import type { Locale } from '@nerdose/core';

import { i18n } from './i18n';
import type { Translate } from './types';

/** Test translator: resolves dotted keys, interpolates `{{var}}`, throws on a missing key. */
export function makeT(locale: Locale): Translate {
  return (key, options = {}) => {
    let node: unknown = i18n.resources[locale];
    for (const part of key.split('.')) {
      if (typeof node !== 'object' || node === null || !(part in node)) {
        throw new Error(`Missing i18n key: ${key} (${locale})`);
      }
      node = (node as Record<string, unknown>)[part];
    }
    if (typeof node !== 'string') throw new Error(`i18n key is not a string: ${key}`);
    return node.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options[name] ?? ''));
  };
}
