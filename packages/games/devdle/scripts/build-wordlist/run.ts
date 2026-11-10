import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { WORDLIST_CLASSES } from './classes';
import { buildUserAgent, createHttpClient } from './http';
import { fetchClassLabels } from './wikidata';
import { buildWordList, filterWords, serializeWordList } from './words';

export class EmptySourceError extends Error {
  constructor(readonly source: 'ENABLE' | 'Wikidata') {
    super(`La fuente ${source} no aportó ninguna palabra válida (A–Z, 4–12 letras).`);
    this.name = 'EmptySourceError';
  }
}

export type BuildWordlistOptions = {
  enable: string;
  outPath: string;
  /** Lista curada (una palabra por línea, `#` = comentario). Opcional. */
  extrasPath?: string;
  contact: string;
  classes?: readonly string[];
  now?: Date;
  fetch?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
  log?: (message: string) => void;
};

export type BuildWordlistCounts = {
  enable: number;
  wikidata: number;
  onlyWikidata: number;
  total: number;
};

export async function runBuildWordlist({
  enable,
  outPath,
  extrasPath,
  contact,
  classes = WORDLIST_CLASSES,
  now = new Date(),
  fetch,
  sleep,
  log = () => {},
}: BuildWordlistOptions): Promise<BuildWordlistCounts> {
  const version = now.toISOString().slice(0, 10).replaceAll('-', '.');
  const client = createHttpClient({
    userAgent: buildUserAgent(version, contact),
    ...(fetch ? { fetch } : {}),
    ...(sleep ? { sleep } : {}),
  });

  const enableText = /^https?:\/\//.test(enable)
    ? await client.getText(enable)
    : await readFile(enable, 'utf8');
  const enableWords = filterWords(enableText.split('\n'));
  if (enableWords.length === 0) throw new EmptySourceError('ENABLE');
  log(`ENABLE filtrado: ${new Set(enableWords).size} palabras`);

  const labels: string[] = [];
  for (const qid of classes) {
    labels.push(...(await fetchClassLabels(client, qid)));
    log(`Wikidata ${qid}: ${labels.length} labels acumulados`);
  }
  const wikidataWords = new Set(filterWords(labels));
  if (wikidataWords.size === 0) throw new EmptySourceError('Wikidata');

  const extras = extrasPath ? (await readFile(extrasPath, 'utf8')).split('\n') : [];
  const words = buildWordList(enableText, labels, extras);
  const enableSet = new Set(enableWords);
  const counts = {
    enable: enableSet.size,
    wikidata: wikidataWords.size,
    onlyWikidata: [...wikidataWords].filter((w) => !enableSet.has(w)).length,
    total: words.length,
  };

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(`${outPath}.tmp`, serializeWordList(words));
  await rename(`${outPath}.tmp`, outPath);
  return counts;
}
