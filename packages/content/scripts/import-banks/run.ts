import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DatasetError } from '../../src';
import {
  manifestSchema,
  termsFileSchema,
  timelineFactsFileSchema,
  type DatasetManifest,
  type TermItem,
  type TimelineFactItem,
} from '../../src/schema';

import type { ImportBank } from './args';
import { TERM_CLASSES, TIMELINE_CLASSES } from './classes';
import { parseInclusions } from './inclusions';
import type { WikimediaClient } from './http';
import {
  MIN_APPROVED_PER_CATEGORY,
  MIN_TIMELINE_CATEGORIES,
  assertTimelineMinimums,
  buildManifest,
  DEFAULT_TIMELINE_PARAMETERS,
  InsufficientTimelineFactsError,
  buildTimelineParameters,
  countByCategory,
  nextDatasetVersion,
} from './manifest';
import {
  evaluateTerms,
  evaluateFacts,
  highestMinSitelinks,
  highestMinSitelinksTimeline,
  mergeByWikidataId,
  parseExclusions,
  precheck,
  precheckFact,
  selectStatements,
  type Candidate,
  type Exclusions,
} from './rules';
import {
  fetchClassCandidates,
  fetchItemCandidates,
  fetchTimelineCandidates,
  type FactCandidate,
  type TermClass,
  type TimelineClass,
} from './wikidata';
import { fetchSummary } from './wikipedia';
import { writeDataset } from './write';

export const MIN_APPROVED_TERMS = 500;
export const DEFAULT_MIN_SITELINKS = 10;

export class InsufficientApprovedError extends Error {
  constructor(
    readonly approved: number,
    readonly minimum: number,
    readonly byCategory: DatasetManifest['counts']['terms']['by_category'],
  ) {
    const detail = Object.entries(byCategory)
      .map(([category, counts]) => `${category}: ${counts.approved}`)
      .join(', ');
    super(
      `Solo hay ${approved} términos approved y el mínimo es ${minimum}. Approved por categoría: ${detail}`,
    );
    this.name = 'InsufficientApprovedError';
  }
}

export type RunImportOptions = {
  dataDir: string;
  bank?: ImportBank;
  classes?: readonly TermClass[];
  timelineClasses?: readonly TimelineClass[];
  minSitelinksTimeline?: number;
  // Solo para tests: el CLI nunca los expone.
  minApprovedPerCategory?: number;
  minCategories?: number;
  minSitelinks?: number;
  minApproved?: number;
  now?: Date;
  client?: WikimediaClient;
  clientFactory?: (datasetVersion: string) => WikimediaClient;
  exclusionsPath?: string;
  inclusionsPath?: string;
  log?: (message: string) => void;
};

export type RunImportResult = {
  manifest: DatasetManifest;
  terms: TermItem[];
  timelineFacts: TimelineFactItem[];
  candidates: Candidate[];
  factCandidates: FactCandidate[];
  suggestedMinSitelinks: number | null;
  suggestedMinSitelinksTimeline: number | null;
};

function readPreviousTerms(dataDir: string): TermItem[] {
  const file = 'terms.json';
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
  } catch (error) {
    throw new DatasetError(file, `No se pudo leer ${file}: ${(error as Error).message}`);
  }
  const parsed = termsFileSchema.safeParse(json);
  if (!parsed.success) throw new DatasetError(file, `${file} inválido: ${parsed.error.message}`);
  return parsed.data;
}

function readPreviousManifest(dataDir: string): DatasetManifest | undefined {
  try {
    const parsed = manifestSchema.safeParse(
      JSON.parse(readFileSync(join(dataDir, 'manifest.json'), 'utf8')),
    );
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function readPreviousTimelineFacts(dataDir: string): TimelineFactItem[] {
  const file = 'timeline_facts.json';
  let raw: string;
  try {
    raw = readFileSync(join(dataDir, file), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw new DatasetError(file, `No se pudo leer ${file}: ${(error as Error).message}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new DatasetError(file, `${file} no es JSON válido: ${(error as Error).message}`);
  }
  const parsed = timelineFactsFileSchema.safeParse(json);
  if (!parsed.success) throw new DatasetError(file, `${file} inválido: ${parsed.error.message}`);
  return parsed.data;
}

async function importTerms(
  client: WikimediaClient,
  {
    classes,
    minSitelinks,
    minApproved,
    exclusions,
    inclusionsPath,
    log,
  }: {
    classes: readonly TermClass[];
    minSitelinks: number;
    minApproved: number;
    exclusions: Exclusions;
    inclusionsPath: string;
    log: (message: string) => void;
  },
): Promise<{ terms: TermItem[]; candidates: Candidate[]; suggestedMinSitelinks: number | null }> {
  const inclusions = parseInclusions(
    existsSync(inclusionsPath) ? readFileSync(inclusionsPath, 'utf8') : '',
  );

  // Las inclusiones van primero: si una clase también trae el ítem, gana su categoría.
  const fetched: Candidate[] = await fetchItemCandidates(client, inclusions);
  if (inclusions.length > 0) {
    log(`Inclusiones: ${fetched.length} de ${inclusions.length} encontradas en Wikidata`);
    const found = new Set(fetched.map((c) => c.wikidata_id));
    for (const { wikidataId } of inclusions) {
      if (!found.has(wikidataId)) log(`  ⚠ inclusión ${wikidataId}: no existe en Wikidata`);
    }
  }
  for (const termClass of classes) {
    const found = await fetchClassCandidates(client, termClass);
    log(`${termClass.wikidataClass} (${termClass.category}): ${found.length} candidatos`);
    fetched.push(...found);
  }
  const candidates = mergeByWikidataId(fetched);
  log(`Candidatos únicos: ${candidates.length}`);

  const pending = candidates.filter((candidate) => precheck(candidate).needsSummary);
  log(`Pidiendo summaries de ${pending.length} candidatos (es y en)`);
  let done = 0;
  for (const candidate of pending) {
    candidate.summary_es = await fetchSummary(client, 'es', candidate.article_es as string);
    candidate.summary_en = await fetchSummary(client, 'en', candidate.article_en as string);
    done += 1;
    if (done % 100 === 0) log(`  summaries: ${done}/${pending.length}`);
  }

  const terms = evaluateTerms(candidates, { minSitelinks, exclusions });
  const included = new Set(inclusions.map((i) => i.wikidataId));
  for (const term of terms) {
    if (included.has(term.wikidata_id) && term.status === 'rejected') {
      log(`  ⚠ inclusión ${term.wikidata_id} (${term.term}) rechazada: ${term.rejection_reason}`);
    }
  }
  const suggestedMinSitelinks = highestMinSitelinks(candidates, { exclusions, minApproved });
  return { terms, candidates, suggestedMinSitelinks };
}

async function importTimelineFacts(
  client: WikimediaClient,
  {
    classes,
    minSitelinks,
    minApprovedPerCategory,
    exclusions,
    currentYear,
    log,
  }: {
    classes: readonly TimelineClass[];
    minSitelinks: number;
    minApprovedPerCategory: number;
    exclusions: Exclusions;
    currentYear: number;
    log: (message: string) => void;
  },
): Promise<{
  facts: TimelineFactItem[];
  candidates: FactCandidate[];
  suggestedMinSitelinksTimeline: number | null;
}> {
  const fetched: FactCandidate[] = [];
  for (const cls of classes) {
    const found = await fetchTimelineCandidates(client, cls, log);
    log(`${cls.wikidataClass} (${cls.category}): ${found.length} candidatos`);
    // Las fechas se filtran por la clase de origen antes de fusionar: el candidato conserva
    // la clase (y la propiedad) de su primera aparición.
    for (const candidate of found) {
      candidate.dates = selectStatements(candidate.dates, cls);
    }
    fetched.push(...found);
  }
  const candidates = mergeByWikidataId(fetched);
  log(`Hechos candidatos únicos: ${candidates.length}`);

  const pending = candidates.filter(
    (candidate) => precheckFact(candidate, { currentYear }).needsSummary,
  );
  log(`Pidiendo summaries de ${pending.length} candidatos de hechos (es y en)`);
  let done = 0;
  for (const candidate of pending) {
    candidate.summary_es = await fetchSummary(client, 'es', candidate.article_es as string);
    candidate.summary_en = await fetchSummary(client, 'en', candidate.article_en as string);
    done += 1;
    if (done % 100 === 0) log(`  summaries de hechos: ${done}/${pending.length}`);
  }

  const facts = evaluateFacts(candidates, { minSitelinks, exclusions, currentYear });
  const suggestedMinSitelinksTimeline = highestMinSitelinksTimeline(candidates, {
    exclusions,
    currentYear,
    minApprovedPerCategory,
    categories: [...new Set(classes.map((cls) => cls.category))],
  });
  return { facts, candidates, suggestedMinSitelinksTimeline };
}

export async function runImport(options: RunImportOptions): Promise<RunImportResult> {
  const {
    dataDir,
    bank = 'all',
    classes = TERM_CLASSES,
    timelineClasses = TIMELINE_CLASSES,
    minApproved = MIN_APPROVED_TERMS,
    minApprovedPerCategory = MIN_APPROVED_PER_CATEGORY,
    minCategories = MIN_TIMELINE_CATEGORIES,
    now = new Date(),
    exclusionsPath = join(dataDir, 'exclusions.txt'),
    inclusionsPath = join(dataDir, 'inclusions.txt'),
    log = () => {},
  } = options;

  // --bank=timeline no toca el banco de términos: se relee y revalida antes de cualquier request.
  const existingTerms = bank === 'timeline' ? readPreviousTerms(dataDir) : undefined;
  const previousFacts = readPreviousTimelineFacts(dataDir);
  const previous = readPreviousManifest(dataDir);
  if (bank === 'timeline' && previous === undefined) {
    throw new DatasetError(
      'manifest.json',
      'manifest.json falta o es inválido: --bank=timeline copia de él los parámetros de terms',
    );
  }
  const datasetVersion = nextDatasetVersion(now, previous?.dataset_version);
  const minSitelinks = options.minSitelinks ?? previous?.min_sitelinks ?? DEFAULT_MIN_SITELINKS;
  const minSitelinksTimeline =
    options.minSitelinksTimeline ??
    previous?.parameters.timeline.min_sitelinks ??
    DEFAULT_TIMELINE_PARAMETERS.min_sitelinks;
  const client = options.client ?? options.clientFactory?.(datasetVersion);
  if (client === undefined) throw new Error('runImport requiere client o clientFactory');

  const exclusions = parseExclusions(
    existsSync(exclusionsPath) ? readFileSync(exclusionsPath, 'utf8') : '',
  );

  let termsPart: Awaited<ReturnType<typeof importTerms>> | null = null;
  if (bank !== 'timeline') {
    termsPart = await importTerms(client, {
      classes,
      minSitelinks,
      minApproved,
      exclusions,
      inclusionsPath,
      log,
    });
  }
  let factsPart: Awaited<ReturnType<typeof importTimelineFacts>> | null = null;
  if (bank !== 'terms') {
    factsPart = await importTimelineFacts(client, {
      classes: timelineClasses,
      minSitelinks: minSitelinksTimeline,
      minApprovedPerCategory,
      exclusions,
      currentYear: now.getUTCFullYear(),
      log,
    });
  }

  const terms = termsPart?.terms ?? existingTerms ?? [];
  const timelineFacts = factsPart?.facts ?? previousFacts;
  const timeline = factsPart
    ? buildTimelineParameters(timelineClasses, {
        minSitelinks: minSitelinksTimeline,
        minApprovedPerCategory,
        minCategories,
      })
    : previous?.parameters.timeline;
  // Con --bank=timeline los parámetros de terms se copian del manifiesto previo.
  const termsParameters =
    bank === 'timeline' && previous !== undefined
      ? {
          minSitelinks: previous.min_sitelinks,
          minApproved: previous.parameters.min_approved_terms,
          classes: previous.parameters.classes.map(({ wikidata_class, category }) => ({
            wikidataClass: wikidata_class,
            category,
          })),
        }
      : { minSitelinks, minApproved, classes };
  const manifest = buildManifest(terms, {
    datasetVersion,
    generatedAt: now.toISOString(),
    ...termsParameters,
    timelineFacts,
    timeline,
  });

  if (termsPart !== null && manifest.counts.terms.approved < minApproved) {
    throw new InsufficientApprovedError(
      manifest.counts.terms.approved,
      minApproved,
      countByCategory(terms),
    );
  }
  if (factsPart !== null) {
    try {
      assertTimelineMinimums(manifest.counts.timeline_facts, {
        categoriesV1: manifest.parameters.timeline.categories_v1,
        minApprovedPerCategory,
        minCategories,
      });
    } catch (error) {
      if (error instanceof InsufficientTimelineFactsError) {
        error.suggestedMinSitelinksTimeline = factsPart.suggestedMinSitelinksTimeline;
      }
      throw error;
    }
  }

  writeDataset(dataDir, { terms, timelineFacts, manifest });
  return {
    manifest,
    terms,
    timelineFacts,
    candidates: termsPart?.candidates ?? [],
    factCandidates: factsPart?.candidates ?? [],
    suggestedMinSitelinks: termsPart?.suggestedMinSitelinks ?? null,
    suggestedMinSitelinksTimeline: factsPart?.suggestedMinSitelinksTimeline ?? null,
  };
}
