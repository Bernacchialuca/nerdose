import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

import { parseImportArgs } from './import-banks/args';
import { createFileCache, resolveCacheDir } from './import-banks/cache';
import { loadImportEnv } from './import-banks/env';
import { createWikimediaClient } from './import-banks/http';
import { buildUserAgent } from './import-banks/manifest';
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

  const { manifest, suggestedMinSitelinks } = await runImport({
    dataDir,
    minSitelinks: args.minSitelinks,
    log: console.log,
    clientFactory: (datasetVersion) =>
      createWikimediaClient({
        userAgent: buildUserAgent(datasetVersion, env.WIKIMEDIA_CONTACT),
        cache: createFileCache(cacheDir),
      }),
  });

  const { terms } = manifest.counts;
  console.log(`\nDataset ${manifest.dataset_version} escrito en ${dataDir}`);
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
} catch (error) {
  if (error instanceof InsufficientApprovedError) {
    console.error(`${error.message}\nNo se escribió ningún archivo.`);
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
}
