import { TIMELINE_CATEGORIES } from '@nerdose/core';
import type { GeneratorHistory, VerificationCheck, VerificationLog } from '@nerdose/core';

import { ITEMS_COUNT, OPAQUE_ID_PATTERN, type TimelinePayload } from '../definition';
import { indistinguishablePairs } from '../shared/dates';
import { addDays, isValidDate } from './days';
import { REUSE_WINDOW_DAYS } from './eligibility';
import type { TimelineFact } from './index';
import { sameOrder } from './opaque';

const filled = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;
const check = (name: string, detail: string | null): VerificationCheck =>
  detail === null ? { name, ok: true } : { name, ok: false, detail };

export function verifyPayload(
  p: TimelinePayload,
  history: GeneratorHistory<TimelinePayload, TimelineFact>,
): VerificationLog {
  const items = Array.isArray(p.items) ? p.items : [];
  const order: unknown[] = Array.isArray(p.correct_order) ? p.correct_order : [];
  const bank = new Map(history.bankItems.map((f) => [f.id, f]));
  const ids = items.map((i) => i?.opaque_id);

  const factIds = new Set(items.map((i) => i?.fact_id));
  const itemsCount =
    items.length === ITEMS_COUNT && factIds.size === ITEMS_COUNT
      ? null
      : `${items.length} items, ${factIds.size} distinct fact_id (expected ${ITEMS_COUNT})`;

  const notInBank = items
    .filter((i) => {
      const f = bank.get(i?.fact_id);
      return (
        !f ||
        f.label !== i.label ||
        f.event_date !== i.event_date ||
        f.date_precision !== i.date_precision
      );
    })
    .map((i) => String(i?.label));

  const categoryProblems: string[] = [];
  if (!(TIMELINE_CATEGORIES as readonly string[]).includes(p.category)) {
    categoryProblems.push(`unknown category ${String(p.category)}`);
  }
  for (const i of items) {
    const f = bank.get(i?.fact_id);
    if (f && f.category !== p.category) categoryProblems.push(`${i.label}: ${f.category}`);
  }

  const missingText: string[] = [];
  if (!filled(p.prompt?.es) || !filled(p.prompt?.en)) missingText.push('prompt');
  for (const i of items) {
    if (!filled(i?.note?.es) || !filled(i?.note?.en)) missingText.push(String(i?.label));
  }

  const pairs = indistinguishablePairs(items.filter((i) => i && i.event_date)).map(
    ([a, b]) => `${a.label}/${b.label}`,
  );

  const dateOf = new Map(items.map((i) => [i?.opaque_id, i?.event_date]));
  const permutation =
    order.length === items.length &&
    new Set(order).size === order.length &&
    order.every((id) => dateOf.has(id as string));
  const dates = order.map((id) => dateOf.get(id as string) ?? '');
  const ascending = dates.every((d, k) => k === 0 || (dates[k - 1] as string) < d);
  const orderDetail =
    permutation && ascending
      ? null
      : permutation
        ? 'correct_order is not chronological'
        : 'correct_order is not a permutation of the items';

  const idsBad =
    new Set(ids).size !== ITEMS_COUNT || ids.some((id) => !OPAQUE_ID_PATTERN.test(String(id)))
      ? 'opaque_id must be 5 unique values of 6 [a-z0-9]'
      : sameOrder([...ids].sort(), order)
        ? 'alphabetical order of opaque_id equals correct_order'
        : null;

  let notUsed: string | null = null;
  if (!isValidDate(p.date)) notUsed = `invalid date ${p.date}`;
  else {
    const limit = addDays(p.date, -REUSE_WINDOW_DAYS);
    const recentIds = new Set(
      history.recentChallenges.flatMap((c) => (c.payload?.items ?? []).map((i) => i.fact_id)),
    );
    const problems: string[] = [];
    for (const i of items) {
      const f = bank.get(i?.fact_id);
      if (f && f.last_used !== null && f.last_used > limit) {
        problems.push(`${i.label}: last_used=${f.last_used} > ${limit}`);
      }
      if (recentIds.has(i?.fact_id)) problems.push(`${i?.label}: used in a recent challenge`);
    }
    if (problems.length) notUsed = problems.join('; ');
  }

  const checks = [
    check('items_count', itemsCount),
    check(
      'facts_in_bank',
      notInBank.length ? `not in bank or altered: ${notInBank.join(', ')}` : null,
    ),
    check('same_category', categoryProblems.length ? categoryProblems.join('; ') : null),
    check(
      'texts_bilingual',
      missingText.length ? `missing es/en for ${missingText.join(', ')}` : null,
    ),
    check('distinguishable', pairs.length ? `indistinguishable: ${pairs.join(', ')}` : null),
    check('correct_order_consistent', orderDetail),
    check('opaque_ids', idsBad),
    check('shuffled', sameOrder(ids, order) ? 'items are in correct order' : null),
    check('not_used_90', notUsed),
  ];
  const failed = checks.find((c) => !c.ok);
  return failed ? { ok: false, checks, reason: failed.name } : { ok: true, checks };
}
