import type { GeneratorHistory, VerificationCheck, VerificationLog } from '@nerdose/core';

import { WORDS_COUNT, WORD_PATTERN, type GrepGridPayload } from '../definition';
import { GRID_SIZE, directionOf, lineCells } from '../shared/geometry';
import { addDays, isValidDate } from './dates';
import { REUSE_WINDOW_DAYS, related } from './eligibility';
import type { GrepGridTerm } from './index';
import { countOccurrences } from './occurrences';

const filled = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;
const check = (name: string, detail: string | null): VerificationCheck =>
  detail === null ? { name, ok: true } : { name, ok: false, detail };

export function verifyPayload(
  p: GrepGridPayload,
  history: GeneratorHistory<GrepGridPayload, GrepGridTerm>,
): VerificationLog {
  const grid: unknown = p.grid;
  const words = Array.isArray(p.words) ? p.words : [];
  const placements = Array.isArray(p.placements) ? p.placements : [];
  const bank = new Map(history.bankItems.map((t) => [t.id, t]));

  const gridOk =
    Array.isArray(grid) &&
    grid.length === GRID_SIZE &&
    grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === GRID_SIZE &&
        row.every((c) => typeof c === 'string' && /^[A-Z]$/.test(c)),
    );
  const gridFailed = 'grid_shape failed';
  const safeGrid = gridOk ? (grid as string[][]) : [];

  const ids = new Set(words.map((w) => w?.term_id));
  const wordsCount =
    words.length === WORDS_COUNT && ids.size === WORDS_COUNT
      ? null
      : `${words.length} words, ${ids.size} distinct term_id (expected ${WORDS_COUNT})`;

  const notInBank = words
    .filter((w) => bank.get(w?.term_id)?.term !== w?.word)
    .map((w) => w?.word ?? '?');

  const badShape = words
    .filter((w) => !WORD_PATTERN.test(String(w?.word)))
    .map((w) => String(w?.word));
  const missingText = words
    .filter((w) => !filled(w?.definition?.es) || !filled(w?.definition?.en))
    .map((w) => String(w?.word));

  const pairs: string[] = [];
  for (const [i, a] of words.entries()) {
    for (const b of words.slice(i + 1)) {
      if (related(String(a?.word), String(b?.word))) pairs.push(`${a?.word}/${b?.word}`);
    }
  }

  let placementsDetail: string | null = null;
  let onceDetail: string | null = null;
  if (!gridOk) {
    placementsDetail = gridFailed;
    onceDetail = gridFailed;
  } else {
    const bad: string[] = [];
    for (const w of words) {
      const pl = placements.find((x) => x?.term_id === w?.term_id);
      const cells = pl && lineCells(pl.from, pl.to);
      const spelled = cells ? cells.map((c) => safeGrid[c.row]?.[c.col]).join('') : null;
      if (!pl || !cells || directionOf(pl.from, pl.to) !== pl.direction || spelled !== w.word) {
        bad.push(String(w?.word));
      }
    }
    if (bad.length) placementsDetail = `inconsistent placements: ${bad.join(', ')}`;
    const wrong = words
      .map((w) => ({ word: String(w?.word), n: countOccurrences(safeGrid, String(w?.word)) }))
      .filter((x) => x.n !== 1);
    if (wrong.length) onceDetail = wrong.map((x) => `${x.word} appears ${x.n} times`).join(', ');
  }

  let notUsed: string | null = null;
  if (!isValidDate(p.date)) notUsed = `invalid date ${p.date}`;
  else {
    const limit = addDays(p.date, -REUSE_WINDOW_DAYS);
    const recentIds = new Set(
      history.recentChallenges.flatMap((c) => (c.payload?.words ?? []).map((w) => w.term_id)),
    );
    const problems: string[] = [];
    for (const w of words) {
      const item = bank.get(w?.term_id);
      if (!item) problems.push(`${w?.word}: term not in bank`);
      else if (item.last_used_grep !== null && item.last_used_grep > limit) {
        problems.push(`${w.word}: last_used_grep=${item.last_used_grep} > ${limit}`);
      }
      if (recentIds.has(w?.term_id)) problems.push(`${w?.word}: used in a recent challenge`);
    }
    if (problems.length) notUsed = problems.join('; ');
  }

  const checks = [
    check('grid_shape', gridOk ? null : `grid must be ${GRID_SIZE}x${GRID_SIZE} of A-Z`),
    check('words_count', wordsCount),
    check('words_in_bank', notInBank.length ? `not in bank: ${notInBank.join(', ')}` : null),
    check('word_shape', badShape.length ? `invalid words: ${badShape.join(', ')}` : null),
    check(
      'texts_bilingual',
      missingText.length ? `missing es/en for ${missingText.join(', ')}` : null,
    ),
    check('no_substrings', pairs.length ? `related words: ${pairs.join(', ')}` : null),
    check('placements_consistent', placementsDetail),
    check('exactly_once', onceDetail),
    check('not_used_30', notUsed),
  ];
  const failed = checks.find((c) => !c.ok);
  return failed ? { ok: false, checks, reason: failed.name } : { ok: true, checks };
}
