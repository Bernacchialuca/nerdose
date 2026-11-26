import { createHash } from 'node:crypto';

import type { RecentChallenge } from '@nerdose/core';

import type { DevdlePayload } from '../definition';
import type { DevdleTerm } from './index';

const mk = (
  id: string,
  term: string,
  category: DevdleTerm['category'],
  last: string | null,
): DevdleTerm => ({
  id,
  term,
  category,
  definition: { es: `definición de ${term}`, en: `definition of ${term}` },
  summary: { es: `resumen de ${term}`, en: `summary of ${term}` },
  last_used_devdle: last,
});

export const T_REACT = mk(
  '11111111-1111-4111-8111-111111111111',
  'REACT',
  'programming_languages',
  null,
);
export const T_MERGE = mk('22222222-2222-4222-8222-222222222222', 'MERGE', 'git', '2025-12-01');
export const T_REDIS = mk(
  '33333333-3333-4333-8333-333333333333',
  'REDIS',
  'databases',
  '2025-12-03',
);
export const T_KERNEL = mk('44444444-4444-4444-8444-444444444444', 'KERNEL', 'linux', '2025-12-02');
export const T_OAUTH = mk(
  '55555555-5555-4555-8555-555555555555',
  'OAUTH',
  'security',
  '2026-12-10',
);
export const T_ROUTER = mk('66666666-6666-4666-8666-666666666666', 'ROUTER', 'networking', null);

export const BANK = [T_REACT, T_MERGE, T_REDIS, T_KERNEL, T_OAUTH, T_ROUTER];
export const DATE = '2026-12-02';
// Como el HMAC-SHA256 real: 32 bytes bien mezclados. Una semilla uniforme (`fill(n)`) se
// anula a estado cero en `rngFrom` y las semillas "casi iguales" dan siempre la misma jugada.
export const seed = (n: number): Uint8Array =>
  new Uint8Array(createHash('sha256').update(`devdle-test-seed-${n}`).digest());

export const payloadFrom = (t: DevdleTerm, date = DATE): DevdlePayload => ({
  term_id: t.id,
  word: t.term,
  category: t.category,
  definition: { ...t.definition },
  summary: { ...t.summary },
  date,
});

export const recent = (
  date: string,
  category: DevdleTerm['category'],
): RecentChallenge<DevdlePayload> => ({
  date,
  payload: { ...payloadFrom(T_MERGE), category },
});
export const RECENT_GIT_DB_LINUX = [
  recent('2026-11-29', 'git'),
  recent('2026-11-30', 'databases'),
  recent('2026-12-01', 'linux'),
];
