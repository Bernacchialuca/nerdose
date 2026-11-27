import { LANGUAGE_LABEL } from '../shared/labels';

import { parseResult } from './parse';

/** Never includes the chosen option nor the answer; identical in es and en. The host appends the site. */
export function share(result: unknown, number: number): string {
  const r = parseResult(result);
  return [`🧮 Big O #${number}`, `${r.win ? '🟩' : '🟥'} ${LANGUAGE_LABEL[r.code_language]}`].join(
    '\n',
  );
}
