import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { manifestSchema, type DatasetManifest, type TermItem } from '../../src/schema';

import { TERM_CLASSES } from './classes';
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
import { fetchClassCandidates, type TermClass } from './wikidata';
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
  log?: (message: string) => void;
};

export type RunImportResult = {
  manifest: DatasetManifest;
  terms: TermItem[];
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

export async function runImport(options: RunImportOptions): Promise<RunImportResult> {
  const {
    dataDir,
    classes = TERM_CLASSES,
    minApproved = MIN_APPROVED_TERMS,
    now = new Date(),
    exclusionsPath = join(dataDir, 'exclusions.txt'),
    log = () => {},
  } = options;

  const previous = readPreviousManifest(dataDir);
  const datasetVersion = nextDatasetVersion(now, previous?.dataset_version);
  const minSitelinks = options.minSitelinks ?? previous?.min_sitelinks ?? DEFAULT_MIN_SITELINKS;
  const client = options.client ?? options.clientFactory?.(datasetVersion);
  if (client === undefined) throw new Error('runImport requiere client o clientFactory');

  const exclusions = parseExclusions(
    existsSync(exclusionsPath) ? readFileSync(exclusionsPath, 'utf8') : '',
  );

  const fetched: Candidate[] = [];
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
  const manifest = buildManifest(terms, {
    datasetVersion,
    generatedAt: now.toISOString(),
    minSitelinks,
    minApproved,
    classes,
  });
  const suggestedMinSitelinks = highestMinSitelinks(candidates, { exclusions, minApproved });

  if (manifest.counts.terms.approved < minApproved) {
    throw new InsufficientApprovedError(
      manifest.counts.terms.approved,
      minApproved,
      countByCategory(terms),
    );
  }

  writeDataset(dataDir, { terms, manifest });
  return { manifest, terms, candidates, suggestedMinSitelinks };
}
