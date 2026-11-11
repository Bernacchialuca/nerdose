import type { DatePrecision, Locale } from '@nerdose/core';

const OPTIONS: Record<DatePrecision, Intl.DateTimeFormatOptions> = {
  year: { year: 'numeric' },
  month: { year: 'numeric', month: 'long' },
  day: { year: 'numeric', month: 'long', day: 'numeric' },
};

/** Nunca inventa mes ni día; `timeZone: 'UTC'` evita que `2014-06-01` caiga en mayo al oeste de UTC. */
export function formatEventDate(
  event_date: string,
  date_precision: DatePrecision,
  locale: Locale,
): string {
  return new Intl.DateTimeFormat(locale, { ...OPTIONS[date_precision], timeZone: 'UTC' }).format(
    new Date(`${event_date}T00:00:00.000Z`),
  );
}
