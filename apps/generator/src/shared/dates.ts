const DAY_MS = 86_400_000;

export function addDays(date: string, days: number): string {
  const base = new Date(`${date}T00:00:00.000Z`).getTime();
  return new Date(base + days * DAY_MS).toISOString().slice(0, 10);
}

export function maxDate(a: string, b: string): string {
  return a >= b ? a : b;
}
