import type { TermCategory } from '@nerdose/core';

import type {
  DatePrecision,
  RejectionReason,
  TermItem,
  TimelineFactItem,
  TimelineRejectionReason,
} from '../../src/schema';

import type { DateStatement, FactCandidate, TimelineClass } from './wikidata';

export type Candidate = {
  wikidata_id: string;
  category: TermCategory;
  label_en: string | null;
  label_es: string | null;
  description_en: string | null;
  description_es: string | null;
  article_en: string | null;
  article_es: string | null;
  sitelinks: number;
  summary_en?: string | null;
  summary_es?: string | null;
};

/**
 * `terms` and `ids` apply to every bank. `timelineIds` (lines `timeline:Q123`) apply only to
 * `timeline_facts`, for items that are valid Devdle terms but do not fit Tech Timeline.
 */
export type Exclusions = { terms: Set<string>; ids: Set<string>; timelineIds: Set<string> };

export type EvaluateOptions = { minSitelinks: number; exclusions: Exclusions };

type CheapReason = Extract<
  RejectionReason,
  'invalid_chars' | 'invalid_length' | 'missing_translation' | 'missing_article'
>;

const MIN_TERM_LENGTH = 4;
const MAX_TERM_LENGTH = 12;

export const TERM_LENGTH = { min: MIN_TERM_LENGTH, max: MAX_TERM_LENGTH } as const;

const filled = (text: string | null | undefined): text is string =>
  text !== null && text !== undefined && text.trim().length > 0;

export function normalizeTerm(label: string): string {
  return label.trim().toUpperCase();
}

export function mergeByWikidataId<T extends { wikidata_id: string }>(
  candidates: readonly T[],
): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.wikidata_id)) continue;
    seen.add(candidate.wikidata_id);
    merged.push(candidate);
  }
  return merged;
}

export function precheck(candidate: Candidate): {
  reason: CheapReason | null;
  needsSummary: boolean;
} {
  const reason = cheapReason(candidate);
  return { reason, needsSummary: reason === null };
}

function cheapReason(candidate: Candidate): CheapReason | null {
  if (filled(candidate.label_en)) {
    const term = normalizeTerm(candidate.label_en);
    if (!/^[A-Z]+$/.test(term)) return 'invalid_chars';
    if (term.length < MIN_TERM_LENGTH || term.length > MAX_TERM_LENGTH) return 'invalid_length';
  }
  if (
    !filled(candidate.label_en) ||
    !filled(candidate.description_es) ||
    !filled(candidate.description_en)
  ) {
    return 'missing_translation';
  }
  if (!filled(candidate.article_es) || !filled(candidate.article_en)) return 'missing_article';
  return null;
}

function toItem(
  candidate: Candidate,
  status: TermItem['status'],
  reason: RejectionReason | null,
): TermItem {
  return {
    wikidata_id: candidate.wikidata_id,
    term: candidate.label_en === null ? '' : normalizeTerm(candidate.label_en),
    category: candidate.category,
    definition: { es: candidate.description_es ?? '', en: candidate.description_en ?? '' },
    summary: { es: candidate.summary_es ?? '', en: candidate.summary_en ?? '' },
    sitelinks: candidate.sitelinks,
    status,
    rejection_reason: reason,
  };
}

function compareIdNumber(a: string, b: string): number {
  return Number(a.slice(1)) - Number(b.slice(1));
}

export function evaluateTerms(
  candidates: readonly Candidate[],
  { minSitelinks, exclusions }: EvaluateOptions,
): TermItem[] {
  const results = new Map<string, TermItem>();
  const survivors = new Map<string, Candidate[]>();

  for (const candidate of candidates) {
    let reason: RejectionReason | null = cheapReason(candidate);
    if (reason === null && !(filled(candidate.summary_es) && filled(candidate.summary_en))) {
      reason = 'missing_article';
    }
    if (reason === null && candidate.sitelinks < minSitelinks) reason = 'low_sitelinks';
    if (reason === null) {
      const term = normalizeTerm(candidate.label_en as string);
      if (exclusions.terms.has(term) || exclusions.ids.has(candidate.wikidata_id)) {
        reason = 'excluded';
      }
    }
    if (reason !== null) {
      results.set(candidate.wikidata_id, toItem(candidate, 'rejected', reason));
      continue;
    }
    const term = normalizeTerm(candidate.label_en as string);
    survivors.set(term, [...(survivors.get(term) ?? []), candidate]);
  }

  for (const group of survivors.values()) {
    const [winner, ...losers] = [...group].sort(
      (a, b) => b.sitelinks - a.sitelinks || compareIdNumber(a.wikidata_id, b.wikidata_id),
    ) as [Candidate, ...Candidate[]];
    results.set(winner.wikidata_id, toItem(winner, 'approved', null));
    for (const loser of losers) {
      results.set(loser.wikidata_id, toItem(loser, 'rejected', 'duplicate'));
    }
  }

  return candidates.map((candidate) => results.get(candidate.wikidata_id) as TermItem);
}

export function parseExclusions(text: string): Exclusions {
  const terms = new Set<string>();
  const ids = new Set<string>();
  const timelineIds = new Set<string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    const timeline = /^timeline:\s*(Q[1-9]\d*)$/i.exec(line);
    if (timeline?.[1] !== undefined) timelineIds.add(timeline[1].toUpperCase());
    else if (/^Q[1-9]\d*$/i.test(line)) ids.add(line.toUpperCase());
    else terms.add(normalizeTerm(line));
  }
  return { terms, ids, timelineIds };
}

export function highestMinSitelinks(
  candidates: readonly Candidate[],
  { exclusions, minApproved }: { exclusions: Exclusions; minApproved: number },
): number | null {
  const approved = evaluateTerms(candidates, { minSitelinks: 0, exclusions })
    .filter((item) => item.status === 'approved')
    .map((item) => item.sitelinks)
    .sort((a, b) => b - a);
  return approved[minApproved - 1] ?? null;
}

// ---------------------------------------------------------------------------------------------
// Hechos de Tech Timeline (REQ-006, decisión 4)
// ---------------------------------------------------------------------------------------------

export const NOTE_MAX_LENGTH = 240;
export const YEAR_MENTION = /\b(1[89]\d{2}|20\d{2})\b/g;
export const MIN_FACT_YEAR = 1800;

const NO_DATE = { event_date: '0000-01-01', date_precision: 'year' as DatePrecision };

type DateFallback = { event_date: string; date_precision: DatePrecision };

export type ResolvedDate =
  | { ok: true; event_date: string; date_precision: DatePrecision }
  | { ok: false; reason: 'disputed_date' | 'imprecise_date'; fallback: DateFallback };

/** Statements que cuentan para la fecha: la propiedad principal o, si no tiene valores vivos, la de fallback. */
export function selectStatements(
  dates: readonly DateStatement[],
  cls: Pick<TimelineClass, 'dateProperty' | 'fallbackProperty'>,
): DateStatement[] {
  const main = dates.filter((d) => d.property === cls.dateProperty);
  if (main.some((d) => d.rank !== 'deprecated') || cls.fallbackProperty === undefined) return main;
  return dates.filter((d) => d.property === cls.fallbackProperty);
}

type ParsedDate = {
  bce: boolean;
  year: number;
  month: number;
  day: number;
  /** 0 = año, 1 = mes, 2 = día (lo que la fecha dice con certeza). */
  level: 0 | 1 | 2;
  imprecise: boolean;
  uncertain: boolean;
};

function parseStatement(statement: DateStatement): ParsedDate | null {
  const match = /^([+-]?)(\d{4,})-(\d{2})-(\d{2})T/.exec(statement.time);
  if (match === null) return null;
  const month = Number(match[3]);
  const day = Number(match[4]);
  const { precision } = statement;
  let level: 0 | 1 | 2 = precision <= 9 ? 0 : precision === 10 ? 1 : 2;
  if (level === 2 && day === 0) level = 1;
  // Un mes 00 no se inventa: con precisión de mes es una fecha imprecisa; con precisión de día baja a año.
  const monthMissing = level >= 1 && month === 0;
  if (monthMissing && precision > 10) level = 0;
  return {
    bce: match[1] === '-',
    year: Number(match[2]),
    month,
    day,
    level,
    imprecise: precision < 9 || (monthMissing && precision === 10),
    uncertain: statement.uncertain,
  };
}

const pad = (value: number, width: number): string => String(value).padStart(width, '0');

function format(date: ParsedDate): DateFallback {
  const level = date.imprecise ? 0 : date.level;
  const year = pad(date.year, 4);
  if (level === 0) return { event_date: `${year}-01-01`, date_precision: 'year' };
  if (level === 1)
    return { event_date: `${year}-${pad(date.month, 2)}-01`, date_precision: 'month' };
  return { event_date: `${year}-${pad(date.month, 2)}-${pad(date.day, 2)}`, date_precision: 'day' };
}

function samePrefix(a: ParsedDate, b: ParsedDate): boolean {
  const level = Math.min(a.level, b.level);
  if (a.bce !== b.bce || a.year !== b.year) return false;
  if (level >= 1 && a.month !== b.month) return false;
  if (level >= 2 && a.day !== b.day) return false;
  return true;
}

function mostPrecise(dates: readonly ParsedDate[]): ParsedDate | null {
  let best: ParsedDate | null = null;
  for (const date of dates) {
    if (
      best === null ||
      (!date.imprecise && best.imprecise) ||
      (date.imprecise === best.imprecise && date.level > best.level)
    ) {
      best = date;
    }
  }
  return best;
}

function fallbackOf(dates: readonly ParsedDate[]): DateFallback {
  const usable = dates.filter((d) => !d.bce && d.year <= 9999);
  const best = mostPrecise(usable);
  return best === null ? { ...NO_DATE } : format(best);
}

export function resolveDate(
  dates: readonly DateStatement[],
  { currentYear }: { currentYear: number },
): ResolvedDate {
  const alive = dates
    .filter((d) => d.rank !== 'deprecated')
    .map((d) => ({ rank: d.rank, parsed: parseStatement(d) }))
    .filter((d): d is { rank: DateStatement['rank']; parsed: ParsedDate } => d.parsed !== null);
  const fallback = fallbackOf(alive.map((d) => d.parsed));
  if (alive.length === 0) return { ok: false, reason: 'imprecise_date', fallback };
  if (alive.some((d) => d.parsed.uncertain))
    return { ok: false, reason: 'disputed_date', fallback };

  const preferred = alive.filter((d) => d.rank === 'preferred');
  const considered = (preferred.length > 0 ? preferred : alive).map((d) => d.parsed);
  for (let i = 0; i < considered.length; i += 1) {
    for (let j = i + 1; j < considered.length; j += 1) {
      if (!samePrefix(considered[i] as ParsedDate, considered[j] as ParsedDate)) {
        return { ok: false, reason: 'disputed_date', fallback };
      }
    }
  }

  const winner = mostPrecise(considered) as ParsedDate;
  if (winner.imprecise || winner.bce || winner.year < MIN_FACT_YEAR || winner.year > currentYear) {
    return { ok: false, reason: 'imprecise_date', fallback };
  }
  return { ok: true, ...format(winner) };
}

const NOT_A_SENTENCE_END =
  /(?:\b(?:Inc|Corp|Ltd|Co|Jr|Sr|St|Dr|Mr|Mrs|Ms|vs|No|Ltda|Bros|U\.S)|\b\p{Lu})\.$/u;

function truncateNote(text: string): string {
  if (text.length <= NOTE_MAX_LENGTH) return text;
  const head = text.slice(0, NOTE_MAX_LENGTH - 1);
  const space = head.lastIndexOf(' ');
  return `${(space > 0 ? head.slice(0, space) : head).trimEnd()}…`;
}

export function firstSentence(text: string): string {
  const clean = text.trim();
  const end = /[.!?](?=\s+\p{Lu}|\s*$)/gu;
  let match: RegExpExecArray | null;
  while ((match = end.exec(clean)) !== null) {
    const sentence = clean.slice(0, match.index + 1);
    if (NOT_A_SENTENCE_END.test(sentence) && match.index + 1 < clean.length) continue;
    return truncateNote(sentence.trim());
  }
  return truncateNote(clean);
}

export type FactEvaluateOptions = {
  minSitelinks: number;
  exclusions: Exclusions;
  currentYear: number;
};

type CheapFactReason = Extract<
  TimelineRejectionReason,
  'disputed_date' | 'imprecise_date' | 'missing_article'
>;

/**
 * Reglas baratas (fecha y artículos) que deciden si hace falta pedir los summaries.
 * `candidate.dates` ya viene filtrado con `selectStatements` según la clase de origen.
 */
export function precheckFact(
  candidate: FactCandidate,
  { currentYear }: { currentYear: number },
): { reason: CheapFactReason | null; needsSummary: boolean } {
  const date = resolveDate(candidate.dates, { currentYear });
  let reason: CheapFactReason | null = date.ok ? null : date.reason;
  if (reason === null && !(filled(candidate.article_es) && filled(candidate.article_en))) {
    reason = 'missing_article';
  }
  return { reason, needsSummary: reason === null };
}

type NoteOutcome = { kind: 'ok'; text: string } | { kind: 'missing' } | { kind: 'mismatch' };

const contradicts = (text: string, year: number): boolean =>
  [...text.matchAll(YEAR_MENTION)].some((m) => Number(m[1]) !== year);

function resolveNote(
  summary: string | null | undefined,
  description: string | null,
  eventYear: number,
): NoteOutcome {
  const sentence = filled(summary) ? firstSentence(summary) : '';
  if (sentence !== '' && !contradicts(sentence, eventYear)) return { kind: 'ok', text: sentence };
  if (!filled(description)) return { kind: 'missing' };
  const fallback = truncateNote(description.trim());
  return contradicts(fallback, eventYear) ? { kind: 'mismatch' } : { kind: 'ok', text: fallback };
}

function toFact(
  candidate: FactCandidate,
  date: DateFallback,
  note: { es: string; en: string },
  reason: TimelineRejectionReason | null,
): TimelineFactItem {
  return {
    wikidata_id: candidate.wikidata_id,
    label: (candidate.label_en ?? '').trim(),
    category: candidate.category,
    event_date: date.event_date,
    date_precision: date.date_precision,
    note,
    sitelinks: candidate.sitelinks,
    status: reason === null ? 'approved' : 'rejected',
    rejection_reason: reason,
  };
}

export function evaluateFacts(
  candidates: readonly FactCandidate[],
  { minSitelinks, exclusions, currentYear }: FactEvaluateOptions,
): TimelineFactItem[] {
  const results = new Map<string, TimelineFactItem>();
  const survivors = new Map<string, FactCandidate[]>();
  const accepted = new Map<string, TimelineFactItem>();

  for (const candidate of candidates) {
    const date = resolveDate(candidate.dates, { currentYear });
    const reject = (reason: TimelineRejectionReason, note = { es: '', en: '' }): void => {
      const when = date.ok ? date : date.fallback;
      results.set(candidate.wikidata_id, toFact(candidate, when, note, reason));
    };
    if (!date.ok) {
      reject(date.reason);
      continue;
    }
    if (
      !filled(candidate.article_es) ||
      !filled(candidate.article_en) ||
      !filled(candidate.summary_es) ||
      !filled(candidate.summary_en)
    ) {
      reject('missing_article');
      continue;
    }
    if (candidate.sitelinks < minSitelinks) {
      reject('low_sitelinks');
      continue;
    }
    const year = Number(date.event_date.slice(0, 4));
    const es = resolveNote(candidate.summary_es, candidate.description_es, year);
    const en = resolveNote(candidate.summary_en, candidate.description_en, year);
    if (es.kind !== 'ok' || en.kind !== 'ok') {
      const missing = es.kind === 'missing' || en.kind === 'missing';
      reject(missing ? 'missing_note' : 'note_year_mismatch', {
        es: es.kind === 'ok' ? es.text : '',
        en: en.kind === 'ok' ? en.text : '',
      });
      continue;
    }
    const label = normalizeTerm(candidate.label_en ?? '');
    if (
      exclusions.ids.has(candidate.wikidata_id) ||
      exclusions.timelineIds.has(candidate.wikidata_id) ||
      exclusions.terms.has(label)
    ) {
      reject('excluded', { es: es.text, en: en.text });
      continue;
    }
    accepted.set(
      candidate.wikidata_id,
      toFact(candidate, date, { es: es.text, en: en.text }, null),
    );
    survivors.set(label, [...(survivors.get(label) ?? []), candidate]);
  }

  for (const group of survivors.values()) {
    const [winner, ...losers] = [...group].sort(
      (a, b) => b.sitelinks - a.sitelinks || compareIdNumber(a.wikidata_id, b.wikidata_id),
    ) as [FactCandidate, ...FactCandidate[]];
    results.set(winner.wikidata_id, accepted.get(winner.wikidata_id) as TimelineFactItem);
    for (const loser of losers) {
      const item = accepted.get(loser.wikidata_id) as TimelineFactItem;
      results.set(loser.wikidata_id, {
        ...item,
        status: 'rejected',
        rejection_reason: 'duplicate',
      });
    }
  }

  return candidates.map((candidate) => results.get(candidate.wikidata_id) as TimelineFactItem);
}

export function highestMinSitelinksTimeline(
  candidates: readonly FactCandidate[],
  {
    exclusions,
    currentYear,
    minApprovedTotal,
  }: {
    exclusions: Exclusions;
    currentYear: number;
    minApprovedTotal: number;
  },
): number | null {
  const sitelinks = evaluateFacts(candidates, { minSitelinks: 0, exclusions, currentYear })
    .filter((item) => item.status === 'approved')
    .map((item) => item.sitelinks)
    .sort((a, b) => b - a);
  return sitelinks[minApprovedTotal - 1] ?? null;
}
