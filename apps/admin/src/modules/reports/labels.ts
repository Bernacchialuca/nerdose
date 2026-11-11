import { REPORT_REASONS } from '@nerdose/core';
import type { GameId, ReportReason, ReportStatus } from '@nerdose/core';

import type { AdminChallenge, ChallengeStatus } from './api/types';

export const GAME_LABELS: Record<GameId, string> = {
  devdle: 'Devdle',
  'bug-hunt': 'Bug Hunt',
  'big-o': 'Big O',
  timeline: 'Tech Timeline',
  'grep-grid': 'Grep Grid',
};

export const REASON_LABELS: Record<ReportReason, string> = {
  wrong_answer: 'Respuesta incorrecta',
  ambiguous: 'Ambiguo',
  wrong_explanation: 'Explicación incorrecta',
  translation: 'Traducción',
  display_bug: 'Error de visualización',
  other: 'Otro',
};

export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, string> = {
  draft: 'borrador',
  approved: 'aprobado',
  published: 'publicado',
  rejected: 'rechazado',
  voided: 'anulado',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'abierto',
  resolved: 'resuelto',
  dismissed: 'descartado',
};

export const PLAY_STATUS_LABELS: Record<string, string> = {
  in_progress: 'partida en curso',
  won: 'partida terminada',
  lost: 'partida terminada',
  voided: 'partida anulada',
};

export const NO_PLAY_LABEL = 'sin partida';

export const CULPRIT_KIND_LABELS = { term: 'Término', timeline_fact: 'Hecho' } as const;

export const STATUS_TABS: { value: ReportStatus; label: string; empty: string }[] = [
  { value: 'open', label: 'Abiertos', empty: 'No hay reportes abiertos. Todo al día.' },
  { value: 'resolved', label: 'Resueltos', empty: 'Todavía no hay reportes resueltos.' },
  { value: 'dismissed', label: 'Descartados', empty: 'Todavía no hay reportes descartados.' },
];

export const challengeLabel = (c: Pick<AdminChallenge, 'game_id' | 'number'>): string =>
  `${GAME_LABELS[c.game_id]} #${c.number}`;

export function reasonsSummary(reasons: Partial<Record<ReportReason, number>>): string {
  return REPORT_REASONS.filter((r) => (reasons[r] ?? 0) > 0)
    .sort((a, b) => (reasons[b] ?? 0) - (reasons[a] ?? 0))
    .map((r) => `${REASON_LABELS[r]} ×${reasons[r] ?? 0}`)
    .join(', ');
}

export function parseStatusParam(value: string | null): ReportStatus {
  return STATUS_TABS.find((t) => t.value === value)?.value ?? 'open';
}
