import { fileURLToPath } from 'node:url';

import { loadDataset, timelineFactsFileSchema } from '@nerdose/content';
import type { Dataset, TimelineFactItem } from '@nerdose/content';
import { timelineFacts } from '@nerdose/db';
import type { Db, NewTimelineFact } from '@nerdose/db';

export const makeFact = (overrides: Partial<TimelineFactItem> = {}): TimelineFactItem => ({
  wikidata_id: 'Q15206305',
  label: 'Docker',
  category: 'frameworks',
  event_date: '2013-03-20',
  date_precision: 'day',
  note: { es: 'Docker se lanzó en 2013.', en: 'Docker was released in 2013.' },
  sitelinks: 60,
  status: 'approved',
  rejection_reason: null,
  ...overrides,
});

const CATEGORIES = [
  'programming_languages',
  'frameworks',
  'companies',
  'operating_systems',
  'hardware',
] as const;

export function makeFacts(n: number, startId = 5000001): TimelineFactItem[] {
  return Array.from({ length: n }, (_, i) =>
    makeFact({
      wikidata_id: `Q${startId + i}`,
      label: `Fact ${i}`,
      category: CATEGORIES[i % CATEGORIES.length]!,
      event_date: new Date(Date.UTC(1980, 0, 1 + i * 37)).toISOString().slice(0, 10),
      date_precision: 'day',
      note: { es: `Hecho ${i}.`, en: `Fact ${i}.` },
    }),
  );
}

export function withFacts(
  base: string,
  facts: TimelineFactItem[],
  version?: string,
): () => Dataset {
  return () => {
    const ds = loadDataset(
      fileURLToPath(new URL(`../fixtures/datasets/${base}/`, import.meta.url)),
    );
    return {
      ...ds,
      timelineFacts: timelineFactsFileSchema.parse(facts),
      manifest: { ...ds.manifest, dataset_version: version ?? ds.manifest.dataset_version },
    };
  };
}

export async function insertFacts(
  owner: Db,
  specs: Array<Partial<NewTimelineFact> & { wikidataId: string }>,
) {
  if (specs.length === 0) return [];
  return owner
    .insert(timelineFacts)
    .values(
      specs.map((spec) => ({
        label: 'Docker',
        category: 'frameworks' as const,
        eventDate: '2013-03-20',
        datePrecision: 'day' as const,
        note: { es: 'Docker se lanzó en 2013.', en: 'Docker was released in 2013.' },
        sitelinks: 50,
        status: 'approved' as const,
        datasetVersion: 'test',
        ...spec,
      })),
    )
    .returning();
}
