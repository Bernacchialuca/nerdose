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
  min_approved_total: 450,
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

// Mínimo total de hechos approved (todas las categorías juntas): cada desafío usa 5 hechos
// (ITEMS_COUNT de @nerdose/game-timeline) y un hecho no se repite dentro de la ventana de 90 días
// (REUSE_WINDOW_DAYS del generador), así que 5 × 90 = 450 cubre la ventana sin repetir.
// No hay mínimo por categoría: el desafío mezcla hechos de todas.
export const TIMELINE_FACTS_PER_CHALLENGE = 5;
export const TIMELINE_REUSE_WINDOW_DAYS = 90;
export const MIN_APPROVED_TIMELINE_TOTAL =
  TIMELINE_FACTS_PER_CHALLENGE * TIMELINE_REUSE_WINDOW_DAYS;
export const MIN_TIMELINE_CATEGORIES = 3;

type TimelineCounts = DatasetManifest['counts']['timeline_facts'];

export function buildTimelineParameters(
  classes: readonly TimelineClass[],
  {
    minSitelinks,
    minApprovedTotal,
    minCategories,
  }: { minSitelinks: number; minApprovedTotal: number; minCategories: number },
): DatasetManifest['parameters']['timeline'] {
  const present = new Set(classes.map((cls) => cls.category));
  return {
    min_sitelinks: minSitelinks,
    min_approved_total: minApprovedTotal,
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
    readonly approved: number,
    readonly minimum: number,
    readonly categoriesV1Count: number,
    readonly minCategories: number,
    readonly byCategory: TimelineCounts['by_category'],
  ) {
    const problems: string[] = [];
    if (approved < minimum) {
      problems.push(
        `Hechos insuficientes: hay ${approved} approved en total y el mínimo es ${minimum}.`,
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
    minApprovedTotal,
    minCategories,
  }: {
    categoriesV1: readonly TimelineCategory[];
    minApprovedTotal: number;
    minCategories: number;
  },
): void {
  const approved = categoriesV1.reduce(
    (total, category) => total + counts.by_category[category].approved,
    0,
  );
  if (approved < minApprovedTotal || categoriesV1.length < minCategories) {
    throw new InsufficientTimelineFactsError(
      approved,
      minApprovedTotal,
      categoriesV1.length,
      minCategories,
      counts.by_category,
    );
  }
}
