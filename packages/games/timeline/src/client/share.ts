import { ITEMS_COUNT, resultSchema } from '../definition/schemas';

import { squares } from './marks';

/** Spoiler-free share text, identical in es/en. The host appends the site. */
export function share(result: unknown, number: number): string {
  const r = resultSchema.parse(result);
  return [`⏳ Tech Timeline #${number}`, `${squares(r)} ${r.score}/${ITEMS_COUNT}`].join('\n');
}
