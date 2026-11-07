import type { DatasetManifest } from './schema';

const idNumber = (id: string): number => Number(id.slice(1));

export function compareWikidataId(a: string, b: string): number {
  return idNumber(a) - idNumber(b);
}

export function sortByWikidataId<T extends { wikidata_id: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareWikidataId(a.wikidata_id, b.wikidata_id));
}

export function serializeItems<T extends { wikidata_id: string }>(items: readonly T[]): string {
  return JSON.stringify(sortByWikidataId(items), null, 2) + '\n';
}

export function serializeManifest(manifest: DatasetManifest): string {
  return JSON.stringify(manifest, null, 2) + '\n';
}
