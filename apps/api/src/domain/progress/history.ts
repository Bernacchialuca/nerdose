import type { Locale } from '@nerdose/core';

export const HISTORY_PAGE_SIZE = 60;
export const VOIDED_LABEL: Record<Locale, string> = { es: 'anulado', en: 'voided' };

/**
 * REQ-011: la página termina en un día completo. El cursor es la fecha de la última fila de la
 * página, así `date < cursor` no repite ni saltea filas (un día tiene a lo sumo 5 Play).
 */
export function pageByFullDays<T extends { date: string }>(
  rows: readonly T[],
  pageSize: number,
): { page: T[]; nextBefore: string | null } {
  if (rows.length <= pageSize) return { page: [...rows], nextBefore: null };
  let end = pageSize;
  const cut = rows[pageSize]!.date;
  if (rows[pageSize - 1]!.date === cut) while (end > 0 && rows[end - 1]!.date === cut) end -= 1;
  const page = rows.slice(0, end);
  return { page, nextBefore: page.at(-1)?.date ?? null };
}
