import type { GameId } from '@nerdose/core';

/** Escapa los comodines de LIKE/ILIKE; `\` es el escape por defecto de Postgres. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Al menos una página, aunque no haya ítems. */
export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Juegos (en el orden dado) cuyo `bankUsage.excludedItems` contiene el texto del ítem. */
export function excludedFrom(
  label: string,
  consumers: ReadonlyArray<{ gameId: GameId; excludedItems?: ReadonlySet<string> }>,
): GameId[] {
  return consumers.filter((c) => c.excludedItems?.has(label) === true).map((c) => c.gameId);
}
