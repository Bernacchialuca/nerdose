import { describe, expect, it } from 'vitest';

import source from './range.ts?raw';
import { defaultRange, rangeCheck, readRange } from './range';

describe('defaultRange', () => {
  it('son los últimos 30 días en UTC (TS-1)', () => {
    expect(defaultRange(new Date('2026-11-11T12:00:00Z'))).toEqual({
      from: '2026-10-13',
      to: '2026-11-11',
    });
    expect(defaultRange(new Date('2026-11-11T23:59:59Z'))).toEqual({
      from: '2026-10-13',
      to: '2026-11-11',
    });
    expect(defaultRange(new Date('2026-11-12T00:00:00Z'))).toEqual({
      from: '2026-10-14',
      to: '2026-11-12',
    });
  });
});

describe('readRange', () => {
  const now = new Date('2026-11-11T12:00:00Z');
  it('lee el rango de la URL y cae al por defecto sin parámetros (TS-2)', () => {
    expect(readRange(new URLSearchParams('from=2026-12-01&to=2026-12-03'), now)).toEqual({
      from: '2026-12-01',
      to: '2026-12-03',
    });
    expect(readRange(new URLSearchParams(''), now)).toEqual({
      from: '2026-10-13',
      to: '2026-11-11',
    });
    expect(readRange(new URLSearchParams('from=2026-12-01'), now)).toEqual({
      from: '2026-12-01',
      to: '',
    });
    expect(readRange(new URLSearchParams('from=2026-13-40&to=2026-12-03'), now)).toEqual({
      from: '',
      to: '2026-12-03',
    });
  });
});

describe('rangeCheck', () => {
  const T = '2026-12-10';
  it('devuelve el motivo y los campos inválidos (TS-3)', () => {
    expect(rangeCheck('', '2026-12-03', T)).toEqual({
      message: 'Elegí las dos fechas del rango.',
      invalid: ['from'],
    });
    expect(rangeCheck('2026-12-05', '2026-12-01', T)).toEqual({
      message: 'La fecha inicial no puede ser posterior a la final.',
      invalid: ['from', 'to'],
    });
    expect(rangeCheck('2026-12-01', '2026-12-11', T)).toEqual({
      message: 'El rango no puede incluir fechas futuras. Hoy es 10/12/2026 (UTC).',
      invalid: ['to'],
    });
    expect(rangeCheck('2025-12-09', '2026-12-10', T)).toEqual({
      message: 'El rango no puede superar los 366 días.',
      invalid: ['from'],
    });
    expect(rangeCheck('2025-12-10', '2026-12-10', T)).toBeNull();
    expect(rangeCheck('2026-12-10', '2026-12-10', T)).toBeNull();
  });
  it('usa una sola regla: validateMetricsRange de core (TS-3)', () => {
    expect(source).toContain('validateMetricsRange(');
  });
});
