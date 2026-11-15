import { today, validateMetricsRange } from '@nerdose/core';

import { formatDay } from '@/lib/format-date';

export type MetricsRange = { from: string; to: string };
export type RangeProblem = { message: string; invalid: ('from' | 'to')[] };

const MS_PER_DAY = 86_400_000;

function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) + n * MS_PER_DAY).toISOString().slice(0, 10);
}

function isDay(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(`${s}T00:00:00.000Z`)) &&
    addDays(s, 0) === s
  );
}

export function defaultRange(now: Date): MetricsRange {
  const to = today(now);
  return { from: addDays(to, -29), to };
}

export function readRange(params: URLSearchParams, now: Date): MetricsRange {
  if (!params.has('from') && !params.has('to')) return defaultRange(now);
  const read = (key: string) => {
    const value = params.get(key) ?? '';
    return isDay(value) ? value : '';
  };
  return { from: read('from'), to: read('to') };
}

export function rangeCheck(from: string, to: string, todayUtc: string): RangeProblem | null {
  if (from === '' || to === '') {
    const invalid: ('from' | 'to')[] = [];
    if (from === '') invalid.push('from');
    if (to === '') invalid.push('to');
    return { message: 'Elegí las dos fechas del rango.', invalid };
  }
  const result = validateMetricsRange(from, to, todayUtc);
  if (result === 'from_after_to') {
    return {
      message: 'La fecha inicial no puede ser posterior a la final.',
      invalid: ['from', 'to'],
    };
  }
  if (result === 'future') {
    return {
      message: `El rango no puede incluir fechas futuras. Hoy es ${formatDay(todayUtc)} (UTC).`,
      invalid: ['to'],
    };
  }
  if (result === 'too_long') {
    return { message: 'El rango no puede superar los 366 días.', invalid: ['from'] };
  }
  return null;
}
