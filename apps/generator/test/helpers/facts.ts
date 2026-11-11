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

type FactSpec = Partial<NewTimelineFact> & { wikidataId: string };

export const FACT_ID = (nn: string) => `10000000-0000-4000-8000-0000000000${nn}`;

function fact(
  nn: string,
  wikidataId: string,
  label: string,
  eventDate: string,
  extra: Partial<NewTimelineFact> = {},
): FactSpec {
  return {
    id: FACT_ID(nn),
    wikidataId,
    label,
    category: 'programming_languages',
    eventDate,
    datePrecision: 'day',
    note: { es: `nota de ${label}`, en: `note on ${label}` },
    ...extra,
  };
}

// Cinco hechos cronológicamente distinguibles, con ids fijos (permiten comparar payloads completos).
export const CHRONO5: FactSpec[] = [
  fact('01', 'Q28865', 'Python', '1991-02-20'),
  fact('02', 'Q251', 'Java', '1995-05-23'),
  fact('03', 'Q37227', 'Go', '2009-11-10'),
  fact('04', 'Q15206305', 'Docker', '2013-03-20'),
  fact('05', 'Q22661306', 'Kubernetes', '2014-06-07'),
];

// Hechos con fechas indistinguibles por precisión: el verify los rechaza.
export const AMBIGUOUS5: FactSpec[] = [
  fact('01', 'Q28865', 'Python', '2009-01-01', { datePrecision: 'year' }),
  fact('02', 'Q251', 'Java', '2009-01-01', { datePrecision: 'year' }),
  fact('03', 'Q37227', 'Go', '2009-01-01', { datePrecision: 'year' }),
  fact('04', 'Q756', 'Node.js', '2009-05-01', { datePrecision: 'month' }),
  fact('05', 'Q15206305', 'Docker', '2013-03-20'),
];

// Cinco hechos más de la misma categoría que CHRONO5 (para tener 10 y probar la exclusión por desafío reciente).
export const EXTRA_PL5: FactSpec[] = [
  fact('11', 'Q575650', 'Rust', '2010-07-07'),
  fact('12', 'Q3816227', 'Kotlin', '2011-07-22'),
  fact('13', 'Q978185', 'TypeScript', '2012-10-01', { datePrecision: 'month' }),
  fact('14', 'Q17118377', 'Swift', '2014-06-02'),
  fact('15', 'Q1299184', 'Elixir', '2012-05-24'),
];
