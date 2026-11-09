import { describe, expect, it } from 'vitest';

import { fillRange } from '@/domain/challenge-publishing/fill.service';

const NOW = new Date('2026-12-01T12:00:00Z');

describe('fillRange', () => {
  it('arranca mañana y cubre 14 días', () => {
    const range = fillRange(NOW, '2026-11-20');
    expect(range).toHaveLength(14);
    expect(range[0]).toBe('2026-12-02');
    expect(range.at(-1)).toBe('2026-12-15');
  });

  it('arranca en LAUNCH_DATE si es futuro', () => {
    const range = fillRange(NOW, '2026-12-10');
    expect(range).toHaveLength(6);
    expect(range[0]).toBe('2026-12-10');
    expect(range.at(-1)).toBe('2026-12-15');
  });

  it('es vacío si el lanzamiento queda fuera de la ventana', () => {
    expect(fillRange(NOW, '2027-01-01')).toEqual([]);
  });

  it('nunca incluye hoy, ni a fin de día', () => {
    const range = fillRange(new Date('2026-12-01T23:59:59Z'), '2026-11-20');
    expect(range).toHaveLength(14);
    expect(range).not.toContain('2026-12-01');
    expect(range[0]).toBe('2026-12-02');
  });
});
