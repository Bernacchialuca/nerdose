import type { BankName } from '@nerdose/core';

import { formatCount } from '@/lib/format-number';
import { GAME_LABELS } from '@/modules/reports';

import type { ContentStockResponse } from './api/types';

export const BANK_LABELS: Record<BankName, { title: string; short: string; noun: string }> = {
  terms: { title: 'Banco de términos', short: 'Términos', noun: 'términos' },
  timeline_facts: { title: 'Banco de hechos', short: 'Hechos', noun: 'hechos' },
};

export function windowLabel(days: number): string {
  return `${formatCount(days)} ${days === 1 ? 'día' : 'días'}`;
}

// Un aviso por juego consumidor que no alcanza para ciclar (el aviso es por juego, no por banco).
export function stockAlerts(data: ContentStockResponse): string[] {
  const alerts: string[] = [];
  for (const bank of data.banks) {
    const { noun } = BANK_LABELS[bank.bank];
    for (const c of bank.consumers) {
      if (c.cycle_ok) continue;
      alerts.push(
        `El banco de ${noun} no alcanza para ciclar: ${GAME_LABELS[c.game_id]} necesita ${formatCount(c.items_per_challenge * c.window_days)} ${noun} aprobados para su ventana de ${formatCount(c.window_days)} días y hay ${formatCount(bank.approved_total)}.`,
      );
    }
  }
  return alerts;
}

export type RejectionRow = { key: string; bank: string; label: string; reason: string };

// La respuesta no trae fecha por rechazo: no se pueden intercalar los bancos por recencia.
export function rejectionRows(data: ContentStockResponse): RejectionRow[] {
  return data.banks.flatMap((bank) =>
    bank.rejections.map((r) => ({
      key: `${bank.bank}:${r.wikidata_id}`,
      bank: BANK_LABELS[bank.bank].short,
      label: r.label,
      reason: r.reason === '' ? 'Sin motivo registrado' : r.reason,
    })),
  );
}
