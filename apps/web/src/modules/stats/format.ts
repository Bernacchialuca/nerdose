import type { Locale } from '@nerdose/core';

const utcDate = (date: string): Date => {
  const [y = 1970, m = 1, d = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

/** «mar 03/11» (es) / «Tue 11/03» (en); siempre UTC, nunca la zona del navegador. */
export function formatShortDate(date: string, locale: Locale): string {
  const value = utcDate(date);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
    .format(value)
    .replace(/\.$/, '');
  const numeric = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  })
    .formatToParts(value)
    .map((p) => (p.type === 'day' || p.type === 'month' ? p.value.padStart(2, '0') : p.value))
    .join('');
  return `${weekday} ${numeric}`;
}

export function formatWinRate(rate: number | null, locale: Locale): string {
  if (rate === null) return '—';
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(rate);
}

export function formatCount(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(n);
}
