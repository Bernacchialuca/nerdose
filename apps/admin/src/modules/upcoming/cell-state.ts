import type { GameId } from '@nerdose/core';

import { GAME_LABELS } from '@/modules/reports';

import { hasPendingRegeneration } from './api/use-upcoming';
import type { UpcomingDay, UpcomingGame, UpcomingResponse } from './api/types';

export type CellKind = 'failure' | 'empty' | 'pending' | 'approved';
export type BadgeTone = 'success' | 'pending' | 'neutral';

export type CellLine = { text: string; tone: BadgeTone; glyph: string; strong?: boolean };

export type CellState = {
  kind: CellKind;
  lines: string[];
  canRegenerate: boolean;
  canOpen: boolean;
};

export const LEGEND: { glyph: string; text: string; tone: BadgeTone }[] = [
  { glyph: '✓', text: 'Aprobado', tone: 'success' },
  { glyph: '○', text: 'Sin desafío', tone: 'neutral' },
  { glyph: '⚠', text: 'Falla de generación', tone: 'pending' },
  { glyph: '↻', text: 'Regenerando…', tone: 'pending' },
  { glyph: '✗', text: 'Regeneración fallida', tone: 'neutral' },
  { glyph: '⚠', text: 'Usa un ítem rechazado', tone: 'pending' },
];

const withDetail = (head: string, detail: string | null): string =>
  detail === null ? head : `${head}: ${detail}`;

/** Una entrada por línea visible de la celda, con su tono y glifo (la UI las pinta como Badge). */
export function cellBadges(game: UpcomingGame): CellLine[] {
  const { challenge, failure, regeneration } = game;
  if (challenge === null && failure !== null) {
    const parts = ['Sin desafío', 'Falla de generación', `${failure.attempts} intentos`];
    if (failure.last_reason !== null) parts.push(failure.last_reason);
    return [{ text: parts.join(' · '), tone: 'pending', glyph: '⚠' }];
  }
  if (challenge === null) return [{ text: 'Sin desafío', tone: 'neutral', glyph: '○' }];
  if (regeneration?.status === 'pending') {
    return [{ text: 'Regenerando…', tone: 'pending', glyph: '↻', strong: true }];
  }
  const badges: CellLine[] = [];
  if (challenge.rejected_items.length > 0) {
    badges.push({
      text: `Usa un ítem rechazado: ${challenge.rejected_items.map((i) => i.label).join(', ')}`,
      tone: 'pending',
      glyph: '⚠',
    });
  }
  if (regeneration?.status === 'failed') {
    badges.push({
      text: withDetail('Aprobado · Regeneración fallida', regeneration.error),
      tone: 'neutral',
      glyph: '✗',
    });
  }
  if (badges.length === 0) badges.push({ text: 'Aprobado', tone: 'success', glyph: '✓' });
  return badges;
}

export function cellState(game: UpcomingGame): CellState {
  const lines = cellBadges(game).map((b) => b.text);
  if (game.challenge === null) {
    return {
      kind: game.failure !== null ? 'failure' : 'empty',
      lines,
      canRegenerate: false,
      canOpen: false,
    };
  }
  if (game.regeneration?.status === 'pending') {
    return { kind: 'pending', lines, canRegenerate: false, canOpen: true };
  }
  return { kind: 'approved', lines, canRegenerate: true, canOpen: true };
}

export function rowLabel(day: Pick<UpcomingDay, 'date' | 'number'>): string {
  const [, mm, dd] = day.date.split('-');
  return `${dd}/${mm} #${day.number}`;
}

export function windowSubtitle(data: UpcomingResponse): string {
  const first = data.days.at(0);
  const last = data.days.at(-1);
  const n = first?.games.length ?? 0;
  return `Del ${first?.date ?? ''} al ${last?.date ?? ''} (UTC) · ${n} ${n === 1 ? 'juego' : 'juegos'} · hoy no se muestra`;
}

export type UpcomingAlerts = {
  failures: string | null;
  pending: boolean;
  regenFailed: string[];
};

export function upcomingAlerts(data: UpcomingResponse | undefined): UpcomingAlerts {
  const failed: { game_id: GameId; date: string; attempts: number }[] = [];
  const regenFailed: string[] = [];
  for (const day of data?.days ?? []) {
    for (const game of day.games) {
      if (game.challenge === null && game.failure !== null) {
        failed.push({ game_id: game.game_id, date: day.date, attempts: game.failure.attempts });
      }
      if (game.challenge !== null && game.regeneration?.status === 'failed') {
        const reason = game.regeneration.error === null ? '' : ` (${game.regeneration.error})`;
        regenFailed.push(
          `No se pudo regenerar ${GAME_LABELS[game.game_id]} del ${day.date}: ningún reemplazo pasó la verificación${reason}. Queda el actual.`,
        );
      }
    }
  }
  let failures: string | null = null;
  if (failed.length > 0) {
    const firstDate = data?.days.at(0)?.date;
    const allTomorrow = failed.every((f) => f.date === firstDate);
    const items = failed
      .map((f) => `${GAME_LABELS[f.game_id]} (${f.date}), falla tras ${f.attempts} intentos`)
      .join('; ');
    const head = failed.length === 1 ? '1 juego no tiene' : `${failed.length} juegos no tienen`;
    failures = `${head} desafío${allTomorrow ? ' para mañana' : ''}: ${items}. Se reintenta en la próxima corrida.`;
  }
  return { failures, pending: hasPendingRegeneration(data), regenFailed };
}
