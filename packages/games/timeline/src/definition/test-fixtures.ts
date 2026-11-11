import type { MoveContext } from '@nerdose/core';

import type { TimelineCategory } from '@nerdose/core';

import { PROMPT } from '../shared/prompts';
import type { TimelineMove, TimelinePayload, TimelineState } from './schemas';

export const ID = {
  PYTHON: '00000000-0000-4000-8000-000000000001',
  JAVA: '00000000-0000-4000-8000-000000000002',
  GO: '00000000-0000-4000-8000-000000000003',
  DOCKER: '00000000-0000-4000-8000-000000000004',
  KUBERNETES: '00000000-0000-4000-8000-000000000005',
} as const;

export const OID = {
  PYTHON: 'p7k2m9',
  JAVA: 'j4x8q1',
  GO: 'g2n5w3',
  DOCKER: 'd9r6t0',
  KUBERNETES: 'k1v3s8',
} as const;

const item = (
  w: keyof typeof ID,
  label: string,
  category: TimelineCategory,
  event_date: string,
  date_precision: 'year' | 'month' | 'day',
) => ({
  fact_id: ID[w],
  opaque_id: OID[w],
  label,
  category,
  event_date,
  date_precision,
  note: { es: `nota de ${label}`, en: `note on ${label}` },
});

// Desafío mixto: tres lenguajes y dos herramientas.
const PYTHON = item('PYTHON', 'Python', 'programming_languages', '1991-02-20', 'day');
const JAVA = item('JAVA', 'Java', 'programming_languages', '1995-05-23', 'day');
const GO = item('GO', 'Go', 'programming_languages', '2009-01-01', 'year');
const DOCKER = item('DOCKER', 'Docker', 'software_tools', '2013-03-20', 'day');
const KUBERNETES = item('KUBERNETES', 'Kubernetes', 'software_tools', '2014-06-01', 'month');

export const CORRECT = [OID.PYTHON, OID.JAVA, OID.GO, OID.DOCKER, OID.KUBERNETES];
export const SWAP = [OID.PYTHON, OID.GO, OID.JAVA, OID.DOCKER, OID.KUBERNETES];
export const REVERSED = [...CORRECT].reverse();
export const ROTATED = [OID.JAVA, OID.GO, OID.DOCKER, OID.KUBERNETES, OID.PYTHON];

export const PAYLOAD: TimelinePayload = {
  date: '2026-12-02',
  prompt: { ...PROMPT },
  items: [GO, KUBERNETES, PYTHON, DOCKER, JAVA],
  correct_order: CORRECT,
};

export const NOW = new Date('2026-12-02T10:00:00.000Z');
export const CTX_ES: MoveContext = { isValidWord: () => true, locale: 'es' };
export const CTX_EN: MoveContext = { isValidWord: () => true, locale: 'en' };
export const S0: TimelineState = {};
export const move = (order: string[]): TimelineMove => ({ order });

export const CHRONO_ITEMS = (locale: 'es' | 'en') =>
  [PYTHON, JAVA, GO, DOCKER, KUBERNETES].map((i) => ({
    opaque_id: i.opaque_id,
    label: i.label,
    category: i.category,
    event_date: i.event_date,
    date_precision: i.date_precision,
    note: i.note[locale],
  }));
