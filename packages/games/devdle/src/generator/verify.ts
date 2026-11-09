import type { GeneratorHistory, VerificationCheck, VerificationLog } from '@nerdose/core';

import { WORD_PATTERN, type DevdlePayload } from '../definition';
import { addDays, isValidDate } from './dates';
import { REUSE_WINDOW_DAYS } from './eligibility';
import type { DevdleTerm } from './index';

const filled = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;
const check = (name: string, detail: string | null): VerificationCheck =>
  detail === null ? { name, ok: true } : { name, ok: false, detail };

export function verifyPayload(
  p: DevdlePayload,
  history: GeneratorHistory<DevdlePayload, DevdleTerm>,
): VerificationLog {
  const item = history.bankItems.find((t) => t.id === p.term_id);

  const missing = (
    [
      ['definition.es', p.definition?.es],
      ['definition.en', p.definition?.en],
      ['summary.es', p.summary?.es],
      ['summary.en', p.summary?.en],
    ] as const
  ).filter(([, v]) => !filled(v));

  let termInBank: string | null = null;
  if (!item) termInBank = `term_id ${p.term_id} not in bank`;
  else if (item.term !== p.word || item.category !== p.category) {
    termInBank = `bank has ${item.term}/${item.category}, payload has ${p.word}/${p.category}`;
  }

  let notUsed: string | null = null;
  if (!item) notUsed = 'term not in bank';
  else if (!isValidDate(p.date)) notUsed = `invalid date ${p.date}`;
  else {
    const limit = addDays(p.date, -REUSE_WINDOW_DAYS);
    if (item.last_used_devdle !== null && item.last_used_devdle > limit) {
      notUsed = `last_used_devdle=${item.last_used_devdle} > ${limit}`;
    }
  }

  const recent = history.recentChallenges.some((c) => c.payload.category === p.category);

  const checks = [
    check('word_shape', WORD_PATTERN.test(p.word) ? null : `invalid word ${p.word}`),
    check(
      'texts_bilingual',
      missing.length ? `missing ${missing.map(([n]) => n).join(', ')}` : null,
    ),
    check('term_in_bank', termInBank),
    check('not_used_365', notUsed),
    check('category_rotation', recent ? `category ${p.category} used in the last days` : null),
  ];
  const failed = checks.find((c) => !c.ok);
  return failed ? { ok: false, checks, reason: failed.name } : { ok: true, checks };
}
