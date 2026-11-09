import type { HttpClient } from './http';

const ENDPOINT = 'https://query.wikidata.org/sparql';

export function buildLabelsQuery(qid: string): string {
  return `SELECT DISTINCT ?item ?label WHERE { ?item wdt:P31/wdt:P279* wd:${qid} . ?item wikibase:sitelinks ?sitelinks . FILTER(?sitelinks >= 5) ?item rdfs:label ?label . FILTER(LANG(?label) = "en") } LIMIT 5000`;
}

export function parseLabels(json: unknown): string[] {
  const bindings = (json as { results?: { bindings?: unknown } } | null)?.results?.bindings;
  if (!Array.isArray(bindings)) return [];
  const labels: string[] = [];
  for (const binding of bindings as { label?: { value?: unknown } }[]) {
    const value = binding?.label?.value;
    if (typeof value === 'string') labels.push(value);
  }
  return labels;
}

export async function fetchClassLabels(client: HttpClient, qid: string): Promise<string[]> {
  const url = `${ENDPOINT}?query=${encodeURIComponent(buildLabelsQuery(qid))}&format=json`;
  return parseLabels(await client.getJson(url, { accept: 'application/sparql-results+json' }));
}
