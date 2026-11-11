import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DatasetError } from '../../src';
import {
  manifestSchema,
  timelineFactsFileSchema,
  type DatasetManifest,
  type TermItem,
  type TimelineFactItem,
} from '../../src/schema';

import { TERM_CLASSES } from './classes';
import { parseInclusions } from './inclusions';
import type { WikimediaClient } from './http';
import { buildManifest, countByCategory, nextDatasetVersion } from './manifest';
import {
  evaluateTerms,
  highestMinSitelinks,
  mergeByWikidataId,
  parseExclusions,
  precheck,
  type Candidate,
} from './rules';
import { fetchClassCandidates, fetchItemCandidates, type TermClass } from './wikidata';
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
  classes?: readonly TermClass[];
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
  suggestedMinSitelinks: number | null;
};

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

export async function runImport(options: RunImportOptions): Promise<RunImportResult> {
  const {
    dataDir,
    classes = TERM_CLASSES,
    minApproved = MIN_APPROVED_TERMS,
    now = new Date(),
    exclusionsPath = join(dataDir, 'exclusions.txt'),
    inclusionsPath = join(dataDir, 'inclusions.txt'),
    log = () => {},
  } = options;

  const timelineFacts = readPreviousTimelineFacts(dataDir);
  const previous = readPreviousManifest(dataDir);
  const datasetVersion = nextDatasetVersion(now, previous?.dataset_version);
  const minSitelinks = options.minSitelinks ?? previous?.min_sitelinks ?? DEFAULT_MIN_SITELINKS;
  const client = options.client ?? options.clientFactory?.(datasetVersion);
  if (client === undefined) throw new Error('runImport requiere client o clientFactory');

  const exclusions = parseExclusions(
    existsSync(exclusionsPath) ? readFileSync(exclusionsPath, 'utf8') : '',
  );

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
  const manifest = buildManifest(terms, {
    datasetVersion,
    generatedAt: now.toISOString(),
    minSitelinks,
    minApproved,
    classes,
    timelineFacts,
    timeline: previous?.parameters.timeline,
  });
  const suggestedMinSitelinks = highestMinSitelinks(candidates, { exclusions, minApproved });

  if (manifest.counts.terms.approved < minApproved) {
    throw new InsufficientApprovedError(
      manifest.counts.terms.approved,
      minApproved,
      countByCategory(terms),
    );
  }

  writeDataset(dataDir, { terms, timelineFacts, manifest });
  return { manifest, terms, timelineFacts, candidates, suggestedMinSitelinks };
}
