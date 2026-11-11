import {
  LOCALES,
  TERM_CATEGORIES,
  TIMELINE_CATEGORIES,
  type TimelineCategory,
} from '@nerdose/core';

import {
  REJECTION_REASONS,
  TIMELINE_REJECTION_REASONS,
  type DatasetManifest,
  type RejectionReason,
  type TermItem,
  type TimelineFactItem,
  type TimelineRejectionReason,
} from '../../src/schema';

import { TERM_LENGTH } from './rules';
import type { TermClass, TimelineClass } from './wikidata';

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
  timelineFacts?: readonly TimelineFactItem[];
  timeline?: DatasetManifest['parameters']['timeline'];
};

export const DEFAULT_TIMELINE_PARAMETERS: DatasetManifest['parameters']['timeline'] = {
  min_sitelinks: 10,
  min_approved_per_category: 100,
  min_categories: 3,
  categories_v1: [],
  classes: [],
};

export function countTimelineFacts(
  facts: readonly TimelineFactItem[],
): DatasetManifest['counts']['timeline_facts'] {
  const byCategory = Object.fromEntries(
    TIMELINE_CATEGORIES.map((category) => [category, { approved: 0, rejected: 0 }]),
  ) as DatasetManifest['counts']['timeline_facts']['by_category'];
  const byReason = Object.fromEntries(
    TIMELINE_REJECTION_REASONS.map((reason) => [reason, 0]),
  ) as Record<TimelineRejectionReason, number>;
  let approved = 0;
  for (const fact of facts) {
    byCategory[fact.category][fact.status] += 1;
    if (fact.status === 'approved') approved += 1;
    else if (fact.rejection_reason !== null) byReason[fact.rejection_reason] += 1;
  }
  return {
    approved,
    rejected: facts.length - approved,
    by_category: byCategory,
    by_reason: byReason,
  };
}

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
  {
    datasetVersion,
    generatedAt,
    minSitelinks,
    minApproved,
    classes,
    timelineFacts = [],
    timeline = DEFAULT_TIMELINE_PARAMETERS,
  }: BuildManifestOptions,
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
      timeline_facts: countTimelineFacts(timelineFacts),
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
      timeline,
    },
  };
}

export const MIN_APPROVED_PER_CATEGORY = 100;
export const MIN_TIMELINE_CATEGORIES = 3;

type TimelineCounts = DatasetManifest['counts']['timeline_facts'];

export function buildTimelineParameters(
  classes: readonly TimelineClass[],
  {
    minSitelinks,
    minApprovedPerCategory,
    minCategories,
  }: { minSitelinks: number; minApprovedPerCategory: number; minCategories: number },
): DatasetManifest['parameters']['timeline'] {
  const present = new Set(classes.map((cls) => cls.category));
  return {
    min_sitelinks: minSitelinks,
    min_approved_per_category: minApprovedPerCategory,
    min_categories: minCategories,
    categories_v1: TIMELINE_CATEGORIES.filter((category) => present.has(category)),
    classes: classes.map(({ wikidataClass, category, dateProperty }) => ({
      wikidata_class: wikidataClass,
      category,
      date_property: dateProperty,
    })),
  };
}

export class InsufficientTimelineFactsError extends Error {
  /** Lo completa runImport: ayuda a calibrar `--min-sitelinks-timeline` aun cuando falla. */
  suggestedMinSitelinksTimeline: number | null = null;

  constructor(
    readonly shortfalls: { category: TimelineCategory; approved: number }[],
    readonly minimum: number,
    readonly categoriesV1Count: number,
    readonly minCategories: number,
    readonly byCategory: TimelineCounts['by_category'],
  ) {
    const problems: string[] = [];
    for (const { category, approved } of shortfalls) {
      problems.push(
        `Hechos insuficientes: ${category} tiene ${approved} approved y el mínimo por categoría es ${minimum}.`,
      );
    }
    if (categoriesV1Count < minCategories) {
      problems.push(`Solo hay ${categoriesV1Count} categorías v1 y el mínimo es ${minCategories}.`);
    }
    const detail = Object.entries(byCategory)
      .map(([category, counts]) => `${category}: ${counts.approved}`)
      .join(', ');
    super(`${problems.join(' ')} Approved por categoría: ${detail}`);
    this.name = 'InsufficientTimelineFactsError';
  }
}

export function assertTimelineMinimums(
  counts: TimelineCounts,
  {
    categoriesV1,
    minApprovedPerCategory,
    minCategories,
  }: {
    categoriesV1: readonly TimelineCategory[];
    minApprovedPerCategory: number;
    minCategories: number;
  },
): void {
  const shortfalls = categoriesV1
    .map((category) => ({ category, approved: counts.by_category[category].approved }))
    .filter(({ approved }) => approved < minApprovedPerCategory);
  if (shortfalls.length > 0 || categoriesV1.length < minCategories) {
    throw new InsufficientTimelineFactsError(
      shortfalls,
      minApprovedPerCategory,
      categoriesV1.length,
      minCategories,
      counts.by_category,
    );
  }
}
