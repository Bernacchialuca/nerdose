import type { TermCategory } from '@nerdose/core';

import type { RejectionReason, TermItem } from '../../src/schema';

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

export type Exclusions = { terms: Set<string>; ids: Set<string> };

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

export function mergeByWikidataId(candidates: readonly Candidate[]): Candidate[] {
  const seen = new Set<string>();
  const merged: Candidate[] = [];
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
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    if (/^Q[1-9]\d*$/i.test(line)) ids.add(line.toUpperCase());
    else terms.add(normalizeTerm(line));
  }
  return { terms, ids };
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
