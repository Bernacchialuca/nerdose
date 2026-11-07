import type { TermCategory } from '@nerdose/core';

import type { WikimediaClient } from './http';
import type { Candidate } from './rules';

export type TermClass = { wikidataClass: string; category: TermCategory };

// Piso de sitelinks de la consulta: acota el volumen. Los ítems por debajo de este valor
// nunca llegarían a aprobarse con un min_sitelinks razonable; las reglas finales las aplica rules.ts.
export const QUERY_SITELINKS_FLOOR = 5;
export const QUERY_LIMIT = 5000;

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

export function buildClassQuery(wikidataClass: string): string {
  return `SELECT DISTINCT ?item ?label_en ?label_es ?description_en ?description_es ?sitelinks ?article_en ?article_es WHERE {
  ?item wdt:P31/wdt:P279* wd:${wikidataClass} .
  ?item wikibase:sitelinks ?sitelinks .
  FILTER(?sitelinks >= ${QUERY_SITELINKS_FLOOR})
  ?item rdfs:label ?label_en . FILTER(LANG(?label_en) = "en")
  OPTIONAL { ?item rdfs:label ?label_es . FILTER(LANG(?label_es) = "es") }
  OPTIONAL { ?item schema:description ?description_en . FILTER(LANG(?description_en) = "en") }
  OPTIONAL { ?item schema:description ?description_es . FILTER(LANG(?description_es) = "es") }
  OPTIONAL { ?article_en_page schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?article_en . }
  OPTIONAL { ?article_es_page schema:about ?item ; schema:isPartOf <https://es.wikipedia.org/> ; schema:name ?article_es . }
}
ORDER BY DESC(?sitelinks)
LIMIT ${QUERY_LIMIT}`;
}

type Binding = Record<string, { type: string; value: string } | undefined>;

export function parseClassResults(json: unknown, category: TermCategory): Candidate[] {
  const bindings = (json as { results?: { bindings?: Binding[] } }).results?.bindings ?? [];
  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  for (const row of bindings) {
    const uri = row.item?.value;
    if (uri === undefined) continue;
    const wikidataId = uri.slice(uri.lastIndexOf('/') + 1);
    if (!/^Q[1-9]\d*$/.test(wikidataId) || seen.has(wikidataId)) continue;
    seen.add(wikidataId);
    const text = (name: string): string | null => row[name]?.value ?? null;
    candidates.push({
      wikidata_id: wikidataId,
      category,
      label_en: text('label_en'),
      label_es: text('label_es'),
      description_en: text('description_en'),
      description_es: text('description_es'),
      article_en: text('article_en'),
      article_es: text('article_es'),
      sitelinks: Number(row.sitelinks?.value ?? 0),
    });
  }
  return candidates;
}

export async function fetchClassCandidates(
  client: WikimediaClient,
  { wikidataClass, category }: TermClass,
): Promise<Candidate[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(buildClassQuery(wikidataClass))}&format=json`;
  const { body } = await client.getJson(url, { accept: 'application/sparql-results+json' });
  return parseClassResults(body, category);
}
