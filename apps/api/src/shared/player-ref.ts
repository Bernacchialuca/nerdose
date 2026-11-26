import { createHash } from 'node:crypto';

/**
 * Primeros 8 hex de sha256(player_id): referencia estable que no expone el id. El id es la
 * credencial de la cookie `nd_pid`, así que nunca se loguea ni se muestra crudo.
 */
export const playerRef = (playerId: string): string =>
  createHash('sha256').update(playerId).digest('hex').slice(0, 8);
