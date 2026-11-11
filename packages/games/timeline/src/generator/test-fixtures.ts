import { createHash } from 'node:crypto';

import type { DatePrecision, GeneratorHistory, TimelineCategory } from '@nerdose/core';

import type { TimelinePayload } from '../definition';
import { ID, PAYLOAD } from '../definition/test-fixtures';
import type { TimelineFact } from './index';

export const DATE = '2026-12-10';
export const DATE_V = '2026-12-02';

export const seed = (n: number): Uint8Array =>
  new Uint8Array(createHash('sha256').update(`timeline-test-seed-${n}`).digest());

export const mk = (
  id: string,
  label: string,
  category: TimelineCategory,
  event_date: string,
  date_precision: DatePrecision,
  last_used: string | null = null,
): TimelineFact => ({
  id,
  label,
  category,
  event_date,
  date_precision,
  note: { es: `nota de ${label}`, en: `note on ${label}` },
  last_used,
});

export const BANK_FIXTURE: TimelineFact[] = PAYLOAD.items.map((i) => ({
  id: i.fact_id,
  label: i.label,
  category: i.category,
  event_date: i.event_date,
  date_precision: i.date_precision,
  note: i.note,
  last_used: null,
}));

export const BID = (nn: string): string => `10000000-0000-4000-8000-0000000000${nn}`;
const PL = 'programming_languages';
const FW = 'frameworks';

export const BANK: TimelineFact[] = [
  mk(BID('01'), 'Python', PL, '1991-02-20', 'day'),
  mk(BID('02'), 'Java', PL, '1995-05-23', 'day', '2026-11-20'),
  mk(BID('03'), 'Go', PL, '2009-01-01', 'year'),
  mk(BID('04'), 'Node.js', PL, '2009-05-01', 'month'),
  mk(BID('05'), 'Rust', PL, '2010-07-07', 'day', '2026-12-20'),
  mk(BID('06'), 'Kotlin', PL, '2011-07-22', 'day', '2026-09-11'),
  mk(BID('07'), 'TypeScript', PL, '2012-10-01', 'month'),
  mk(BID('08'), 'Swift', PL, '2014-06-02', 'day', '2026-09-12'),
  mk(BID('09'), 'Elixir', PL, '2012-05-24', 'day'),
  mk(BID('21'), 'Django', FW, '2005-07-15', 'day'),
  mk(BID('22'), 'Angular', FW, '2010-10-20', 'day'),
  mk(BID('23'), 'React', FW, '2013-05-29', 'day'),
  mk(BID('24'), 'Vue.js', FW, '2014-02-01', 'month'),
];

export const BANK_TIGHT: TimelineFact[] = [
  BANK[0],
  mk(BID('02'), 'Java', PL, '1995-05-23', 'day'),
  BANK[2],
  BANK[3],
  mk(BID('10'), 'Docker', PL, '2013-03-20', 'day'),
].filter((f): f is TimelineFact => f !== undefined);

export const history = (
  bankItems: TimelineFact[],
  recentChallenges: { date: string; payload: TimelinePayload }[] = [],
): GeneratorHistory<TimelinePayload, TimelineFact> => ({ bankItems, recentChallenges });

export { ID };
