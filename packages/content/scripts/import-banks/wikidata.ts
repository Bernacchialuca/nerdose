import type { TermCategory } from '@nerdose/core';

import type { WikimediaClient } from './http';
import type { Inclusion } from './inclusions';
import type { Candidate } from './rules';

export type TermClass = { wikidataClass: string; category: TermCategory };

// Piso de sitelinks de la consulta: acota el volumen. Los ítems por debajo de este valor
// nunca llegarían a aprobarse con un min_sitelinks razonable; las reglas finales las aplica rules.ts.
export const QUERY_SITELINKS_FLOOR = 5;
export const QUERY_LIMIT = 5000;

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

const SELECT_FIELDS =
  'SELECT DISTINCT ?item ?label_en ?label_es ?description_en ?description_es ?sitelinks ?article_en ?article_es WHERE {';

// Wikidata guarda muchos nombres propios solo en la etiqueta `mul` (MySQL, Redis, Debian…):
// se usa la del idioma y, si falta, la `mul`. Sin esto esos ítems ni aparecen como candidatos.
const ITEM_FIELDS = `  ?item wikibase:sitelinks ?sitelinks .
  OPTIONAL { ?item rdfs:label ?label_en_only . FILTER(LANG(?label_en_only) = "en") }
  OPTIONAL { ?item rdfs:label ?label_es_only . FILTER(LANG(?label_es_only) = "es") }
  OPTIONAL { ?item rdfs:label ?label_mul . FILTER(LANG(?label_mul) = "mul") }
  BIND(COALESCE(?label_en_only, ?label_mul) AS ?label_en)
  BIND(COALESCE(?label_es_only, ?label_mul) AS ?label_es)
  FILTER(BOUND(?label_en))
  OPTIONAL { ?item schema:description ?description_en . FILTER(LANG(?description_en) = "en") }
  OPTIONAL { ?item schema:description ?description_es . FILTER(LANG(?description_es) = "es") }
  OPTIONAL { ?article_en_page schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?article_en . }
  OPTIONAL { ?article_es_page schema:about ?item ; schema:isPartOf <https://es.wikipedia.org/> ; schema:name ?article_es . }
`;

export function buildClassQuery(wikidataClass: string): string {
  return `${SELECT_FIELDS}
  ?item wdt:P31/wdt:P279* wd:${wikidataClass} .
  FILTER(?sitelinks >= ${QUERY_SITELINKS_FLOOR})
${ITEM_FIELDS}}
ORDER BY DESC(?sitelinks)
LIMIT ${QUERY_LIMIT}`;
}

/** Consulta por ítems puntuales (inclusiones): mismos campos, sin clase ni piso de sitelinks. */
export function buildItemsQuery(wikidataIds: readonly string[]): string {
  return `${SELECT_FIELDS}
  VALUES ?item { ${wikidataIds.map((id) => `wd:${id}`).join(' ')} }
${ITEM_FIELDS}}`;
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

export async function fetchItemCandidates(
  client: WikimediaClient,
  inclusions: readonly Inclusion[],
): Promise<Candidate[]> {
  if (inclusions.length === 0) return [];
  const categories = new Map(inclusions.map((i) => [i.wikidataId, i.category]));
  const query = buildItemsQuery(inclusions.map((i) => i.wikidataId));
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const { body } = await client.getJson(url, { accept: 'application/sparql-results+json' });
  return parseClassResults(body, inclusions[0]!.category).map((candidate) => ({
    ...candidate,
    category: categories.get(candidate.wikidata_id) ?? candidate.category,
  }));
}
