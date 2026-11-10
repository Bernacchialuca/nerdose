import { createHash } from 'node:crypto';

import type { GeneratorHistory } from '@nerdose/core';

import { ID } from '../definition/test-fixtures';
import type { GrepGridPayload } from '../definition';
import type { GrepGridTerm } from './index';

export const DATE = '2026-12-02';

export const seed = (n: number): Uint8Array =>
  new Uint8Array(createHash('sha256').update(`grep-grid-test-seed-${n}`).digest());

export const mk = (id: string, term: string, last: string | null = null): GrepGridTerm => ({
  id,
  term,
  category: 'software_engineering',
  definition: { es: `definición de ${term}`, en: `definition of ${term}` },
  summary: { es: `resumen de ${term}`, en: `summary of ${term}` },
  last_used_grep: last,
});

export const BANK_FIXTURE: GrepGridTerm[] = (Object.keys(ID) as (keyof typeof ID)[]).map((w) =>
  mk(ID[w], w),
);

const withLast = (term: string, last: string): GrepGridTerm[] =>
  BANK_FIXTURE.map((t) => (t.term === term ? { ...t, last_used_grep: last } : t));

export const BANK: GrepGridTerm[] = [
  ...withLast('DOCKER', '2026-11-02').map((t) =>
    t.term === 'REDIS' ? { ...t, last_used_grep: '2025-01-01' } : t,
  ),
  mk('10000000-0000-4000-8000-000000000001', 'ROUTER'),
  mk('10000000-0000-4000-8000-000000000002', 'LINUX'),
  mk('10000000-0000-4000-8000-000000000003', 'SCRIPT'),
  mk('10000000-0000-4000-8000-000000000004', 'JAVASCRIPT'),
  mk('10000000-0000-4000-8000-000000000005', 'TYPESCRIPT'),
  mk('10000000-0000-4000-8000-000000000006', 'SWIFT', '2026-11-03'),
  mk('10000000-0000-4000-8000-000000000007', 'NGINX', '2026-12-10'),
];

export const history = (
  bankItems: GrepGridTerm[],
  recentChallenges: { date: string; payload: GrepGridPayload }[] = [],
): GeneratorHistory<GrepGridPayload, GrepGridTerm> => ({ bankItems, recentChallenges });
