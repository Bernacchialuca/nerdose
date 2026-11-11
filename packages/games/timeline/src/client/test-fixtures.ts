import type { TimelinePublicView, TimelineResult } from '../definition/schemas';

const item = (opaque_id: string, label: string) => ({ opaque_id, label });

export const PUBLIC_VIEW_ES: TimelinePublicView = {
  category: 'programming_languages',
  prompt: 'Ordená estos lenguajes del más antiguo al más reciente',
  items: [
    item('g2n5w3', 'Go'),
    item('k1v3s8', 'Kubernetes'),
    item('p7k2m9', 'Python'),
    item('d9r6t0', 'Docker'),
    item('j4x8q1', 'Java'),
  ],
};
export const PUBLIC_VIEW_EN: TimelinePublicView = {
  ...PUBLIC_VIEW_ES,
  prompt: 'Order these languages from oldest to newest',
};
export const PUBLIC_VIEW_OTHER: TimelinePublicView = {
  category: 'frameworks',
  prompt: 'Ordená estos frameworks del más antiguo al más reciente',
  items: [
    item('a1a1a1', 'React'),
    item('b2b2b2', 'Vue'),
    item('c3c3c3', 'Angular'),
    item('d4d4d4', 'Svelte'),
    item('e5e5e5', 'Ember'),
  ],
};
export const STATE_EMPTY = {};
export const INITIAL_ORDER = ['g2n5w3', 'k1v3s8', 'p7k2m9', 'd9r6t0', 'j4x8q1'];

const CORRECT = ['p7k2m9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'k1v3s8'];
const SWAP = ['p7k2m9', 'g2n5w3', 'j4x8q1', 'd9r6t0', 'k1v3s8'];
const ROTATED = ['j4x8q1', 'g2n5w3', 'd9r6t0', 'k1v3s8', 'p7k2m9'];

const chrono = (locale: 'es' | 'en'): TimelineResult['items'] => {
  const note = (label: string) => (locale === 'es' ? `nota de ${label}` : `note on ${label}`);
  return [
    { opaque_id: 'p7k2m9', label: 'Python', event_date: '1991-02-20', date_precision: 'day' },
    { opaque_id: 'j4x8q1', label: 'Java', event_date: '1995-05-23', date_precision: 'day' },
    { opaque_id: 'g2n5w3', label: 'Go', event_date: '2009-01-01', date_precision: 'year' },
    { opaque_id: 'd9r6t0', label: 'Docker', event_date: '2013-03-20', date_precision: 'day' },
    { opaque_id: 'k1v3s8', label: 'Kubernetes', event_date: '2014-06-01', date_precision: 'month' },
  ].map((i) => ({
    ...i,
    date_precision: i.date_precision as 'day' | 'year' | 'month',
    note: note(i.label),
  }));
};

const result = (locale: 'es' | 'en', submitted: string[]): TimelineResult => {
  const score = submitted.filter((id, i) => id === CORRECT[i]).length;
  return {
    win: score === 5,
    score,
    category: 'programming_languages',
    correct_order: CORRECT,
    submitted_order: submitted,
    items: chrono(locale),
  };
};

export const RESULT_3_ES = result('es', SWAP);
export const RESULT_3_EN = result('en', SWAP);
export const RESULT_5_ES = result('es', CORRECT);
export const RESULT_0_ES = result('es', ROTATED);
