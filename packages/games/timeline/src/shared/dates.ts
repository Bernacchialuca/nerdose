import type { DatePrecision } from '@nerdose/core';

export type DatedFact = { event_date: string; date_precision: DatePrecision };

/**
 * Dos hechos se distinguen si sus años difieren; en el mismo año, solo si ambos tienen
 * precisión mes o día y los meses difieren, o ambos tienen día y las fechas difieren.
 */
export function distinguishable(a: DatedFact, b: DatedFact): boolean {
  if (a.event_date.slice(0, 4) !== b.event_date.slice(0, 4)) return true;
  if (a.event_date === b.event_date) return false;
  if (a.date_precision === 'year' || b.date_precision === 'year') return false;
  if (a.event_date.slice(5, 7) !== b.event_date.slice(5, 7)) return true;
  return a.date_precision === 'day' && b.date_precision === 'day';
}

export function indistinguishablePairs<T extends DatedFact>(facts: readonly T[]): [T, T][] {
  const pairs: [T, T][] = [];
  for (const [i, a] of facts.entries()) {
    for (const b of facts.slice(i + 1)) {
      if (!distinguishable(a, b)) pairs.push([a, b]);
    }
  }
  return pairs;
}

export const allDistinguishable = (facts: readonly DatedFact[]): boolean =>
  indistinguishablePairs(facts).length === 0;

export function compareChronological(
  a: DatedFact & { id: string },
  b: DatedFact & { id: string },
): number {
  if (a.event_date !== b.event_date) return a.event_date < b.event_date ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
