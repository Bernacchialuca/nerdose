import type { TermCategory } from '@nerdose/core';
import { terms } from '@nerdose/db';
import type { Db } from '@nerdose/db';

export type TermSpec = {
  term: string;
  category: TermCategory;
  lastUsedDevdle?: string | null;
  definition?: { es: string; en: string };
  summary?: { es: string; en: string };
  status?: 'approved' | 'rejected';
};

export const BANK16: TermSpec[] = [
  { term: 'REACT', category: 'programming_languages' },
  { term: 'PYTHON', category: 'programming_languages' },
  { term: 'MERGE', category: 'git' },
  { term: 'REBASE', category: 'git' },
  { term: 'REDIS', category: 'databases' },
  { term: 'MYSQL', category: 'databases' },
  { term: 'ROUTER', category: 'networking' },
  { term: 'SOCKET', category: 'networking' },
  { term: 'KERNEL', category: 'linux' },
  { term: 'DAEMON', category: 'linux' },
  { term: 'OAUTH', category: 'apis' },
  { term: 'TOKEN', category: 'apis' },
  { term: 'CIPHER', category: 'security' },
  { term: 'FIREWALL', category: 'security' },
  { term: 'REFACTOR', category: 'software_engineering' },
  { term: 'COMPILER', category: 'software_engineering' },
];

export async function insertTerms(owner: Db, specs: readonly TermSpec[]) {
  if (specs.length === 0) return [];
  return owner
    .insert(terms)
    .values(
      specs.map((spec, index) => ({
        term: spec.term,
        category: spec.category,
        definition: spec.definition ?? {
          es: `definición ${spec.term}`,
          en: `definition ${spec.term}`,
        },
        summary: spec.summary ?? { es: `resumen ${spec.term}`, en: `summary ${spec.term}` },
        wikidataId: `Q${1000 + index}`,
        sitelinks: 50,
        status: spec.status ?? 'approved',
        rejectionReason: spec.status === 'rejected' ? 'excluded' : null,
        lastUsedDevdle: spec.lastUsedDevdle ?? null,
        datasetVersion: 'test',
      })),
    )
    .returning();
}
