import {
  payloadSchema,
  type TimelinePayload,
  type TimelineState,
} from '@nerdose/game-timeline/definition';

import { MUTATION_HEADERS } from './app';
import type { useDatabases } from './db';

type Dbs = ReturnType<typeof useDatabases>;
type Locale = 'es' | 'en';
type Precision = 'year' | 'month' | 'day';

export const TL_ID = {
  PYTHON: '00000000-0000-4000-8000-000000000001',
  JAVA: '00000000-0000-4000-8000-000000000002',
  GO: '00000000-0000-4000-8000-000000000003',
  DOCKER: '00000000-0000-4000-8000-000000000004',
  KUBERNETES: '00000000-0000-4000-8000-000000000005',
} as const;

export const TL_OID = {
  PYTHON: 'p7k2m9',
  JAVA: 'j4x8q1',
  GO: 'g2n5w3',
  DOCKER: 'd9r6t0',
  KUBERNETES: 'k1v3s8',
} as const;

type Milestone = keyof typeof TL_ID;

// Desafío mixto: tres lenguajes y dos herramientas (cada item lleva la categoría de su hecho).
export const TL_CATEGORY = {
  PYTHON: 'programming_languages',
  JAVA: 'programming_languages',
  GO: 'programming_languages',
  DOCKER: 'software_tools',
  KUBERNETES: 'software_tools',
} as const;

const item = (w: Milestone, label: string, event_date: string, date_precision: Precision) => ({
  fact_id: TL_ID[w],
  opaque_id: TL_OID[w],
  label,
  category: TL_CATEGORY[w],
  event_date,
  date_precision,
  note: { es: `nota de ${label}`, en: `note on ${label}` },
});

const PYTHON = item('PYTHON', 'Python', '1991-02-20', 'day');
const JAVA = item('JAVA', 'Java', '1995-05-23', 'day');
const GO = item('GO', 'Go', '2009-01-01', 'year');
const DOCKER = item('DOCKER', 'Docker', '2013-03-20', 'day');
const KUBERNETES = item('KUBERNETES', 'Kubernetes', '2014-06-01', 'month');

export const CORRECT = [TL_OID.PYTHON, TL_OID.JAVA, TL_OID.GO, TL_OID.DOCKER, TL_OID.KUBERNETES];
export const SWAP = [TL_OID.PYTHON, TL_OID.GO, TL_OID.JAVA, TL_OID.DOCKER, TL_OID.KUBERNETES];
export const REVERSED = [...CORRECT].reverse();
export const ROTATED = [TL_OID.JAVA, TL_OID.GO, TL_OID.DOCKER, TL_OID.KUBERNETES, TL_OID.PYTHON];

const PROMPT = {
  es: 'Ordená estos hitos del más antiguo al más reciente',
  en: 'Order these milestones from oldest to newest',
};

// Falla en el import si la fixture queda mal formada.
export const TL_PAYLOAD: TimelinePayload = payloadSchema.parse({
  date: '2026-12-01',
  prompt: PROMPT,
  items: [GO, KUBERNETES, PYTHON, DOCKER, JAVA],
  correct_order: CORRECT,
});

const publicView = (locale: Locale) => ({
  prompt: PROMPT[locale],
  items: [GO, KUBERNETES, PYTHON, DOCKER, JAVA].map(({ opaque_id, label, category }) => ({
    opaque_id,
    label,
    category,
  })),
});

export const TL_PUBLIC_ES = publicView('es');
export const TL_PUBLIC_EN = publicView('en');

export const tlChrono = (locale: Locale) =>
  [PYTHON, JAVA, GO, DOCKER, KUBERNETES].map((i) => ({
    opaque_id: i.opaque_id,
    label: i.label,
    category: i.category,
    event_date: i.event_date,
    date_precision: i.date_precision,
    note: i.note[locale],
  }));

export const tlResult = (order: string[], locale: Locale) => {
  const score = CORRECT.filter((id, i) => order[i] === id).length;
  return {
    win: score === 5,
    score,
    correct_order: CORRECT,
    submitted_order: order,
    items: tlChrono(locale),
  };
};

/** `extra` esperado tras una partida: cada hito suma a la categoría de su hecho. */
export const tlStats = (order: string[]) => {
  const byCategory: Record<string, { played: number; correct: number }> = {};
  CORRECT.forEach((id, k) => {
    const w = (Object.keys(TL_OID) as Milestone[]).find((m) => TL_OID[m] === id)!;
    const cur = byCategory[TL_CATEGORY[w]] ?? { played: 0, correct: 0 };
    byCategory[TL_CATEGORY[w]] = {
      played: cur.played + 1,
      correct: cur.correct + (order[k] === id ? 1 : 0),
    };
  });
  return { by_category: byCategory };
};

// Lo que nunca puede aparecer en una respuesta o log previo al cierre.
export const TL_FORBIDDEN = [
  '"correct_order":',
  '"submitted_order":',
  '"event_date":',
  '"date_precision":',
  '"note":',
  '"fact_id":',
  '"payload":',
  ...Object.values(TL_ID),
  ...[PYTHON, JAVA, GO, DOCKER, KUBERNETES].map((i) => i.event_date),
  'nota de ',
  'note on ',
  JSON.stringify(CORRECT),
];

export function seedTimeline(
  dbs: Dbs,
  opts: Parameters<Dbs['insertChallenge']>[0] extends infer T ? Partial<T> : never = {},
) {
  return dbs.insertChallenge({
    gameId: 'timeline',
    date: '2026-12-01',
    number: 8,
    payload: TL_PAYLOAD,
    status: 'published',
    ...opts,
  });
}

export function seedTimelinePlay(
  dbs: Dbs,
  challengeId: string,
  playerId: string,
  state: TimelineState,
  extra: Record<string, unknown> = {},
) {
  return dbs.insertPlay({
    playerId,
    challengeId,
    gameId: 'timeline',
    date: '2026-12-01',
    state,
    ...extra,
  });
}

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };

export const tlPost = (
  app: App,
  action: 'move' | 'start',
  payload: unknown,
  player?: { id: string },
  query = '',
) =>
  app.request(`/api/games/timeline/today/${action}${query}`, {
    method: 'POST',
    headers: { ...MUTATION_HEADERS, ...(player ? { Cookie: `nd_pid=${player.id}` } : {}) },
    body: JSON.stringify(payload),
  });

export const tlMove = (
  app: App,
  order: string[] | Record<string, unknown>,
  player?: { id: string },
  query = '',
  challengeNumber = 8,
) =>
  tlPost(
    app,
    'move',
    { challenge_number: challengeNumber, move: Array.isArray(order) ? { order } : order },
    player,
    query,
  );

export const tlGet = (app: App, player?: { id: string }, query = '') =>
  app.request(`/api/games/timeline/today${query}`, {
    headers: player ? { Cookie: `nd_pid=${player.id}` } : {},
  });
