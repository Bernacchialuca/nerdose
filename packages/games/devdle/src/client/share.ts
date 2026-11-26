import { MAX_GUESSES } from '../definition/schemas';

import { MARK_EMOJI } from './marks';
import { parseResult } from './parse';

/** Neutral notation, identical in es/en; never includes the solution. The host appends the site. */
export function share(result: unknown, number: number): string {
  const r = parseResult(result);
  const hint = r.hint ? ' 💡' : '';
  const header = `🟩 Devdle #${number} · ${r.win ? r.score : 'X'}/${MAX_GUESSES}${hint}`;
  const rows = r.guesses.map((g) => g.marks.map((m) => MARK_EMOJI[m]).join(''));
  return [header, ...rows].join('\n');
}
