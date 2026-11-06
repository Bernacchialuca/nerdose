import type { Locale } from '@nerdose/core';

/** Fecha del eyebrow de la home: `martes 3 nov` / `Tuesday Nov 3`, siempre en UTC. */
export function formatDayLabel(date: string, locale: Locale): string {
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).formatToParts(new Date(`${date}T00:00:00Z`));
  return parts
    .filter((p) => p.type === 'weekday' || p.type === 'day' || p.type === 'month')
    .map((p) => (p.type === 'month' ? p.value.replace(/\.$/, '') : p.value))
    .join(' ');
}
