import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

import { parseImportArgs } from './import-banks/args';
import { createFileCache, resolveCacheDir } from './import-banks/cache';
import { loadImportEnv } from './import-banks/env';
import { createWikimediaClient } from './import-banks/http';
import { buildUserAgent } from './import-banks/manifest';
import {
  InsufficientTimelineFactsError,
  MIN_APPROVED_TIMELINE_TOTAL,
} from './import-banks/manifest';
import { InsufficientApprovedError, MIN_APPROVED_TERMS, runImport } from './import-banks/run';

try {
  if (process.env.NODE_ENV !== 'test') {
    config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)), quiet: true });
  }
  const env = loadImportEnv(process.env);
  const args = parseImportArgs(process.argv.slice(2));
  const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
  const cacheDir = resolveCacheDir(args.cacheDir, repoRoot);
  const dataDir = fileURLToPath(new URL('../data/', import.meta.url));
  console.log(`Cache: ${cacheDir}`);

  const { manifest, suggestedMinSitelinks, suggestedMinSitelinksTimeline } = await runImport({
    dataDir,
    bank: args.bank,
    minSitelinks: args.minSitelinks,
    minSitelinksTimeline: args.minSitelinksTimeline,
    log: console.log,
    clientFactory: (datasetVersion) =>
      createWikimediaClient({
        userAgent: buildUserAgent(datasetVersion, env.WIKIMEDIA_CONTACT),
        cache: createFileCache(cacheDir),
      }),
  });

  console.log(`\nDataset ${manifest.dataset_version} escrito en ${dataDir}`);
  if (args.bank !== 'timeline') {
    const { terms } = manifest.counts;
    console.log(`min_sitelinks usado: ${manifest.min_sitelinks}`);
    console.log(`approved: ${terms.approved} · rejected: ${terms.rejected}`);
    console.log('Por categoría:');
    for (const [category, counts] of Object.entries(terms.by_category)) {
      console.log(`  ${category}: approved ${counts.approved}, rejected ${counts.rejected}`);
    }
    console.log('Rechazos por motivo:');
    for (const [reason, count] of Object.entries(terms.by_reason)) {
      console.log(`  ${reason}: ${count}`);
    }
    console.log(
      `Valor más alto que mantiene ≥ ${MIN_APPROVED_TERMS} approved: ${suggestedMinSitelinks ?? 'ninguno'}`,
    );
  }
  if (args.bank !== 'terms') {
    const facts = manifest.counts.timeline_facts;
    const { timeline } = manifest.parameters;
    console.log(`\nHechos — approved: ${facts.approved} · rejected: ${facts.rejected}`);
    console.log(`min_sitelinks_timeline usado: ${timeline.min_sitelinks}`);
    console.log(`categories_v1: ${timeline.categories_v1.join(', ')}`);
    console.log('Por categoría:');
    for (const category of timeline.categories_v1) {
      const counts = facts.by_category[category];
      console.log(`  ${category}: approved ${counts.approved}, rejected ${counts.rejected}`);
    }
    console.log('Rechazos por motivo:');
    for (const [reason, count] of Object.entries(facts.by_reason)) {
      console.log(`  ${reason}: ${count}`);
    }
    console.log(
      `Valor más alto que mantiene ≥ ${MIN_APPROVED_TIMELINE_TOTAL} approved en total: ${suggestedMinSitelinksTimeline ?? 'ninguno'}`,
    );
  }
} catch (error) {
  if (
    error instanceof InsufficientApprovedError ||
    error instanceof InsufficientTimelineFactsError
  ) {
    console.error(`${error.message}\nNo se escribió ningún archivo.`);
    if (error instanceof InsufficientTimelineFactsError) {
      console.error(
        `Valor más alto que mantiene ≥ ${MIN_APPROVED_TIMELINE_TOTAL} approved en total: ${error.suggestedMinSitelinksTimeline ?? 'ninguno'}`,
      );
    }
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
}
