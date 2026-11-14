/** Suma `n` días (puede ser negativo) a un día `YYYY-MM-DD`, en UTC. */
export function shiftDay(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) + n * 86_400_000).toISOString().slice(0, 10);
}
