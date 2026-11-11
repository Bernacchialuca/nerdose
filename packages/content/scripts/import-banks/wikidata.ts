import type { TermCategory, TimelineCategory } from '@nerdose/core';

import type { WikimediaClient } from './http';
import type { Inclusion } from './inclusions';
import type { Candidate } from './rules';

export type TermClass = { wikidataClass: string; category: TermCategory };

// Piso de sitelinks de la consulta: acota el volumen. Los ítems por debajo de este valor
// nunca llegarían a aprobarse con un min_sitelinks razonable; las reglas finales las aplica rules.ts.
export const QUERY_SITELINKS_FLOOR = 5;
export const QUERY_LIMIT = 5000;

export const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

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

export type TimelineDateProperty = 'P571' | 'P577';

export type TimelineClass = {
  wikidataClass: string;
  category: TimelineCategory;
  dateProperty: TimelineDateProperty;
  fallbackProperty?: 'P571';
  /** Piso de sitelinks propio de la clase (clases enormes que dan timeout con el piso general). */
  queryFloor?: number;
};

export type DateStatement = {
  property: TimelineDateProperty;
  time: string;
  precision: number;
  rank: 'preferred' | 'normal' | 'deprecated';
  uncertain: boolean;
};

export type FactCandidate = {
  wikidata_id: string;
  category: TimelineCategory;
  label_en: string | null;
  description_en: string | null;
  description_es: string | null;
  article_en: string | null;
  article_es: string | null;
  sitelinks: number;
  dates: DateStatement[];
  summary_en?: string | null;
  summary_es?: string | null;
};

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

// Incertidumbre de una fecha. WDQS expone de un valor de tiempo solo timeValue, timePrecision,
// timeTimezone y timeCalendarModel: `before`/`after` del JSON de Wikidata no existen en SPARQL
// (verificado en la primera corrida). Se usan los calificadores con que Wikidata marca la duda:
// earliest date (P1319), latest date (P1326) y sourcing circumstances (P1480) = circa (Q5727902).
export const CIRCA = 'http://www.wikidata.org/entity/Q5727902';

const TIMELINE_FIELDS =
  'SELECT DISTINCT ?item ?label_en ?label_es ?description_en ?description_es ?sitelinks ?article_en ?article_es ?date_prop ?time ?precision ?rank ?earliest ?latest ?sourcing WHERE {';

// Una fila por (ítem, statement de fecha, calificadores): el LIMIT cuenta filas, no ítems.
export const TIMELINE_QUERY_LIMIT = QUERY_LIMIT * 4;

export function buildTimelineClassQuery(cls: TimelineClass): string {
  const properties = [cls.dateProperty, ...(cls.fallbackProperty ? [cls.fallbackProperty] : [])];
  const values = properties.map((p) => `("${p}" p:${p} psv:${p})`).join(' ');
  return `${TIMELINE_FIELDS}
  ?item wdt:P31/wdt:P279* wd:${cls.wikidataClass} .
  FILTER(?sitelinks >= ${cls.queryFloor ?? QUERY_SITELINKS_FLOOR})
  VALUES (?date_prop ?p ?psv) { ${values} }
  ?item ?p ?st .
  ?st ?psv ?v ; wikibase:rank ?rank .
  ?v wikibase:timeValue ?time ; wikibase:timePrecision ?precision .
  OPTIONAL { ?st pq:P1319 ?earliest . }
  OPTIONAL { ?st pq:P1326 ?latest . }
  OPTIONAL { ?st pq:P1480 ?sourcing . }
${ITEM_FIELDS}}
ORDER BY DESC(?sitelinks)
LIMIT ${TIMELINE_QUERY_LIMIT}`;
}

const RANKS: Record<string, DateStatement['rank']> = {
  'http://wikiba.se/ontology#PreferredRank': 'preferred',
  'http://wikiba.se/ontology#NormalRank': 'normal',
  'http://wikiba.se/ontology#DeprecatedRank': 'deprecated',
};

export function parseTimelineResults(json: unknown, category: TimelineCategory): FactCandidate[] {
  const bindings = (json as { results?: { bindings?: Binding[] } }).results?.bindings ?? [];
  const byId = new Map<string, FactCandidate>();
  for (const row of bindings) {
    const uri = row.item?.value;
    if (uri === undefined) continue;
    const wikidataId = uri.slice(uri.lastIndexOf('/') + 1);
    if (!/^Q[1-9]\d*$/.test(wikidataId)) continue;
    const text = (name: string): string | null => row[name]?.value ?? null;
    let candidate = byId.get(wikidataId);
    if (candidate === undefined) {
      candidate = {
        wikidata_id: wikidataId,
        category,
        label_en: text('label_en'),
        description_en: text('description_en'),
        description_es: text('description_es'),
        article_en: text('article_en'),
        article_es: text('article_es'),
        sitelinks: Number(row.sitelinks?.value ?? 0),
        dates: [],
      };
      byId.set(wikidataId, candidate);
    }
    const time = text('time');
    const rank = RANKS[row.rank?.value ?? ''];
    const property = text('date_prop');
    if (time === null || rank === undefined) continue;
    if (property !== 'P571' && property !== 'P577') continue;
    const statement: DateStatement = {
      property,
      time,
      precision: Number(row.precision?.value ?? 0),
      rank,
      uncertain:
        row.earliest !== undefined || row.latest !== undefined || row.sourcing?.value === CIRCA,
    };
    // Las combinaciones de OPTIONAL multiplican filas: se deduplica por contenido; si una de
    // las filas iguales es incierta, el statement es incierto.
    const same = candidate.dates.find(
      (d) =>
        d.property === statement.property &&
        d.time === statement.time &&
        d.precision === statement.precision &&
        d.rank === statement.rank,
    );
    if (same === undefined) candidate.dates.push(statement);
    else same.uncertain ||= statement.uncertain;
  }
  return [...byId.values()];
}

export async function fetchTimelineCandidates(
  client: WikimediaClient,
  cls: TimelineClass,
  log: (message: string) => void = () => {},
): Promise<FactCandidate[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(buildTimelineClassQuery(cls))}&format=json`;
  const { body } = await client.getJson(url, { accept: 'application/sparql-results+json' });
  const rows = (body as { results?: { bindings?: unknown[] } }).results?.bindings?.length ?? 0;
  if (rows >= TIMELINE_QUERY_LIMIT) {
    log(
      `  ⚠ ${cls.wikidataClass}: la consulta alcanzó el LIMIT de filas; subí queryFloor de la clase`,
    );
  }
  return parseTimelineResults(body, cls.category);
}
