import { GAME_IDS } from '@nerdose/core';
import type { GameId } from '@nerdose/core';

import { formatDayShort } from '@/lib/format-date';
import { CHALLENGE_STATUS_LABELS, GAME_LABELS } from '@/modules/reports';

import type {
  ChallengeQualityRow,
  DailyPlayersRow,
  RetentionRow,
  StreakBucket,
  StreakBucketRow,
} from './api/types';

const PERCENT = new Intl.NumberFormat('es', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const EMPTY_VALUE = '—';
export const EMPTY_RANGE = 'Sin datos en el rango.';

export const NOTES = {
  daily: 'El total cuenta a cada jugador una vez por día: no es la suma de las columnas.',
  retention:
    'Cohorte: jugadores cuya primera partida completada fue ese día. D1 y D7: porcentaje que completó alguna partida exactamente 1 y 7 días después. Las partidas anuladas cuentan como completadas.',
  streaks:
    'Racha global viva a hoy: no depende del rango elegido. El tramo 0 incluye a quienes nunca completaron una partida.',
  quality: 'Las partidas anuladas no cuentan en terminadas ni en victorias.',
} as const;

export function formatPercent(v: number | null): string {
  return v === null ? EMPTY_VALUE : PERCENT.format(v);
}

export type DailyRow = { date: string; total: number; games: Record<GameId, number> };

function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

export function dailyRows(daily: DailyPlayersRow[], from: string, to: string): DailyRow[] {
  if (daily.length === 0) return [];
  const byDay = new Map<string, DailyRow>();
  const blank = (date: string): DailyRow => ({
    date,
    total: 0,
    games: Object.fromEntries(GAME_IDS.map((g) => [g, 0])) as Record<GameId, number>,
  });
  for (const row of daily) {
    const entry = byDay.get(row.date) ?? blank(row.date);
    if (row.game_id === null) entry.total = row.players;
    else entry.games[row.game_id] = row.players;
    byDay.set(row.date, entry);
  }
  const rows: DailyRow[] = [];
  for (let day = to; day >= from; day = addDays(day, -1)) {
    rows.push(byDay.get(day) ?? blank(day));
  }
  return rows;
}

export function retentionRows(retention: RetentionRow[]): RetentionRow[] {
  return [...retention].sort((a, b) => (a.cohort_date < b.cohort_date ? 1 : -1));
}

export const STREAK_LABELS: Record<StreakBucket, string> = {
  '0': '0',
  '1': '1',
  '2-6': '2–6',
  '7-29': '7–29',
  '30+': '30+',
};

export function streakRows(dist: StreakBucketRow[]) {
  const sum = dist.reduce((acc, r) => acc + r.players, 0);
  return dist.map((r) => ({
    label: STREAK_LABELS[r.bucket],
    players: r.players,
    share: sum === 0 ? EMPTY_VALUE : formatPercent(r.players / sum),
  }));
}

export const QUALITY_COLUMNS = [
  { key: 'challenge', label: 'Desafío' },
  { key: 'game', label: 'Juego' },
  { key: 'started', label: 'Iniciadas' },
  { key: 'finished', label: 'Terminadas' },
  { key: 'completion_rate', label: 'Completado' },
  { key: 'win_rate', label: 'Victorias' },
  { key: 'reports', label: 'Reportes' },
  { key: 'status', label: 'Estado' },
] as const;

export type QualityKey = (typeof QUALITY_COLUMNS)[number]['key'];
export type QualitySort = { key: QualityKey; dir: 'ascending' | 'descending' };

export const DEFAULT_QUALITY_SORT: QualitySort = { key: 'challenge', dir: 'descending' };

export function nextSort(current: QualitySort, key: QualityKey): QualitySort {
  if (current.key === key) {
    return { key, dir: current.dir === 'ascending' ? 'descending' : 'ascending' };
  }
  return { key, dir: 'ascending' };
}

const cmp = (a: number | string, b: number | string): number => (a < b ? -1 : a > b ? 1 : 0);

function value(row: ChallengeQualityRow, key: QualityKey): number | string | null {
  if (key === 'challenge') return row.date;
  if (key === 'game') return GAME_LABELS[row.game_id];
  if (key === 'status') return CHALLENGE_STATUS_LABELS[row.status];
  return row[key];
}

export function sortQuality(rows: ChallengeQualityRow[], sort: QualitySort): ChallengeQualityRow[] {
  const sign = sort.dir === 'ascending' ? 1 : -1;
  const tiebreak = (a: ChallengeQualityRow, b: ChallengeQualityRow) =>
    cmp(b.date, a.date) || GAME_IDS.indexOf(a.game_id) - GAME_IDS.indexOf(b.game_id);
  return [...rows].sort((a, b) => {
    const va = value(a, sort.key);
    const vb = value(b, sort.key);
    if (va === null && vb === null) return tiebreak(a, b);
    if (va === null) return 1;
    if (vb === null) return -1;
    let result: number;
    if (sort.key === 'challenge') result = cmp(va, vb) || cmp(a.number, b.number);
    else if (typeof va === 'string' && typeof vb === 'string') result = va.localeCompare(vb, 'es');
    else result = cmp(va, vb);
    return result === 0 ? tiebreak(a, b) : result * sign;
  });
}

export const challengeCell = (row: Pick<ChallengeQualityRow, 'number' | 'date'>): string =>
  `#${row.number} · ${formatDayShort(row.date)}`;
