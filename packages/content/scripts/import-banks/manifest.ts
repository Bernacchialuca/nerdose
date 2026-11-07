import { LOCALES, TERM_CATEGORIES } from '@nerdose/core';

import {
  REJECTION_REASONS,
  type DatasetManifest,
  type RejectionReason,
  type TermItem,
} from '../../src/schema';

import { TERM_LENGTH } from './rules';
import type { TermClass } from './wikidata';

export { buildUserAgent } from './http';

export function nextDatasetVersion(now: Date, previous: string | undefined): string {
  const pad = (value: number, width = 2): string => String(value).padStart(width, '0');
  const base = `${now.getUTCFullYear()}.${pad(now.getUTCMonth() + 1)}.${pad(now.getUTCDate())}`;
  if (previous === undefined) return base;
  if (previous === base) return `${base}-2`;
  const sameDay = new RegExp(`^${base.replaceAll('.', '\\.')}-(\\d+)$`).exec(previous);
  return sameDay ? `${base}-${Number(sameDay[1]) + 1}` : base;
}

export type BuildManifestOptions = {
  datasetVersion: string;
  generatedAt: string;
  minSitelinks: number;
  minApproved: number;
  classes: readonly TermClass[];
};

export function countByCategory(
  terms: readonly TermItem[],
): DatasetManifest['counts']['terms']['by_category'] {
  const counts = Object.fromEntries(
    TERM_CATEGORIES.map((category) => [category, { approved: 0, rejected: 0 }]),
  ) as DatasetManifest['counts']['terms']['by_category'];
  for (const term of terms) counts[term.category][term.status] += 1;
  return counts;
}

export function buildManifest(
  terms: readonly TermItem[],
  { datasetVersion, generatedAt, minSitelinks, minApproved, classes }: BuildManifestOptions,
): DatasetManifest {
  const byReason = Object.fromEntries(REJECTION_REASONS.map((reason) => [reason, 0])) as Record<
    RejectionReason,
    number
  >;
  let approved = 0;
  for (const term of terms) {
    if (term.status === 'approved') approved += 1;
    else if (term.rejection_reason !== null) byReason[term.rejection_reason] += 1;
  }
  return {
    dataset_version: datasetVersion,
    generated_at: generatedAt,
    min_sitelinks: minSitelinks,
    counts: {
      terms: {
        approved,
        rejected: terms.length - approved,
        by_category: countByCategory(terms),
        by_reason: byReason,
      },
    },
    parameters: {
      min_sitelinks: minSitelinks,
      min_approved_terms: minApproved,
      term_length: { ...TERM_LENGTH },
      languages: [...LOCALES],
      classes: classes.map(({ wikidataClass, category }) => ({
        wikidata_class: wikidataClass,
        category,
      })),
    },
  };
}
