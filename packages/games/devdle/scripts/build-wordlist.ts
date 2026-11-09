import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

import { parseWordlistArgs } from './build-wordlist/args';
import { loadWordlistEnv } from './build-wordlist/env';
import { runBuildWordlist } from './build-wordlist/run';

try {
  if (process.env.NODE_ENV !== 'test') {
    config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)), quiet: true });
  }
  const env = loadWordlistEnv(process.env);
  const args = parseWordlistArgs(process.argv.slice(2));
  const outPath = fileURLToPath(new URL('../wordlist/words.txt', import.meta.url));

  const counts = await runBuildWordlist({
    enable: args.enable,
    outPath,
    contact: env.WIKIMEDIA_CONTACT,
    log: console.log,
  });

  console.log(`\nLista escrita en ${outPath}`);
  console.log(`ENABLE filtrado: ${counts.enable} · labels de Wikidata: ${counts.wikidata}`);
  console.log(`Solo en Wikidata: ${counts.onlyWikidata} · total: ${counts.total}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
