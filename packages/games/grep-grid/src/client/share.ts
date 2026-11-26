import { WORDS_COUNT } from '../definition/schemas';

import { parseResult } from './parse';

/**
 * Neutral notation, identical in es/en; never the words nor whether the player gave up. The host
 * appends the site.
 */
export function share(result: unknown, number: number): string {
  const r = parseResult(result);
  return [`🔎 Grep Grid #${number}`, `${r.score}/${WORDS_COUNT}`].join('\n');
}
