import { describe, expect, it } from 'vitest';

import { HISTORY_PAGE_SIZE, VOIDED_LABEL, pageByFullDays } from '@/domain/progress/history';

const rows = (dates: string[]) => dates.map((date, i) => ({ date, i }));
const rep = (d: string, n: number) => Array.from({ length: n }, () => d);

describe('pageByFullDays', () => {
  it('TS-25a sin filas', () => {
    expect(pageByFullDays([], 60)).toEqual({ page: [], nextBefore: null });
  });

  it('TS-25b exactamente 60 filas: una sola página', () => {
    const r = rows(rep('2026-12-01', 60));
    expect(pageByFullDays(r, 60)).toEqual({ page: r, nextBefore: null });
  });

  it('TS-25c 61 filas con la 61 en otro día: página de 60 y cursor de la fila 60', () => {
    const r = rows([...rep('2026-12-19', 60), '2026-12-18']);
    const out = pageByFullDays(r, 60);
    expect(out.page).toEqual(r.slice(0, 60));
    expect(out.nextBefore).toBe('2026-12-19');
  });

  it('TS-25d día partido: se recorta a un día completo', () => {
    const r = rows([...rep('2026-12-20', 56), '2026-12-19', ...rep('2026-12-18', 4)]);
    const out = pageByFullDays(r, 60);
    expect(out.page).toEqual(r.slice(0, 57));
    expect(out.nextBefore).toBe('2026-12-19');
  });

  it('la página tiene entre 56 y 60 filas con a lo sumo 5 por día', () => {
    const days = Array.from({ length: 20 }, (_, i) => `2026-12-${String(30 - i).padStart(2, '0')}`);
    const r = rows(days.flatMap((d) => rep(d, 5)));
    const { page } = pageByFullDays(r.slice(0, 61), HISTORY_PAGE_SIZE);
    expect(page.length).toBeGreaterThanOrEqual(56);
    expect(page.length).toBeLessThanOrEqual(60);
  });
});

describe('VOIDED_LABEL', () => {
  it('etiqueta por locale', () => {
    expect(VOIDED_LABEL).toEqual({ es: 'anulado', en: 'voided' });
  });
});
