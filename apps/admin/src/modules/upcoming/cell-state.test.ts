import { describe, expect, it } from 'vitest';

import {
  FAILURES_ONE,
  UPCOMING_EMPTY_CELL,
  UPCOMING_FAILURE,
  UPCOMING_OK,
  UPCOMING_PENDING,
  UPCOMING_REGEN_FAILED,
  UPCOMING_REJECTED_ITEM,
  upcoming,
} from '@/test/fixtures/upcoming';

import type { UpcomingGame, UpcomingResponse } from './api/types';
import { hasPendingRegeneration } from './api/use-upcoming';
import { cellState, rowLabel, upcomingAlerts, windowSubtitle } from './cell-state';

const cell = (data: UpcomingResponse, date: string, gameId: string): UpcomingGame => {
  const game = data.days.find((d) => d.date === date)?.games.find((g) => g.game_id === gameId);
  if (!game) throw new Error('celda inexistente');
  return game;
};

describe('hasPendingRegeneration (TS-5)', () => {
  it('solo es true con un pedido pending', () => {
    expect(hasPendingRegeneration(UPCOMING_PENDING)).toBe(true);
    expect(hasPendingRegeneration(UPCOMING_REGEN_FAILED)).toBe(false);
    expect(hasPendingRegeneration(UPCOMING_OK)).toBe(false);
    expect(hasPendingRegeneration(undefined)).toBe(false);
  });
});

describe('cellState (TS-6)', () => {
  it('falla de generación', () => {
    expect(cellState(cell(UPCOMING_FAILURE, '2026-12-02', 'devdle'))).toEqual({
      kind: 'failure',
      lines: ['Sin desafío · Falla de generación · 20 intentos · no_valid_term'],
      canRegenerate: false,
      canOpen: false,
    });
  });

  it('sin desafío ni falla', () => {
    expect(cellState(cell(UPCOMING_EMPTY_CELL, '2026-12-03', 'timeline'))).toEqual({
      kind: 'empty',
      lines: ['Sin desafío'],
      canRegenerate: false,
      canOpen: false,
    });
  });

  it('regeneración pendiente', () => {
    expect(cellState(cell(UPCOMING_PENDING, '2026-12-05', 'grep-grid'))).toEqual({
      kind: 'pending',
      lines: ['Regenerando…'],
      canRegenerate: false,
      canOpen: true,
    });
  });

  it('regeneración fallida, ítem rechazado y aprobado', () => {
    expect(cellState(cell(UPCOMING_REGEN_FAILED, '2026-12-05', 'grep-grid'))).toEqual({
      kind: 'approved',
      lines: ['Aprobado · Regeneración fallida: overlap_conflict'],
      canRegenerate: true,
      canOpen: true,
    });
    expect(cellState(cell(UPCOMING_REJECTED_ITEM, '2026-12-05', 'devdle'))).toMatchObject({
      kind: 'approved',
      lines: ['Usa un ítem rechazado: CAP theorem'],
      canRegenerate: true,
    });
    expect(cellState(cell(UPCOMING_OK, '2026-12-02', 'devdle'))).toMatchObject({
      kind: 'approved',
      lines: ['Aprobado'],
      canRegenerate: true,
    });
  });

  it('omite el último tramo cuando no hay motivo', () => {
    const failure = cell(UPCOMING_FAILURE, '2026-12-02', 'devdle');
    const noReason = { ...failure, failure: { ...failure.failure!, last_reason: null } };
    expect(cellState(noReason).lines).toEqual(['Sin desafío · Falla de generación · 20 intentos']);
    const failed = cell(UPCOMING_REGEN_FAILED, '2026-12-05', 'grep-grid');
    const noError = { ...failed, regeneration: { ...failed.regeneration!, error: null } };
    expect(cellState(noError).lines).toEqual(['Aprobado · Regeneración fallida']);
  });

  it('un ítem rechazado y una regeneración fallida se muestran juntos', () => {
    const rejected = cell(UPCOMING_REJECTED_ITEM, '2026-12-05', 'devdle');
    const both: UpcomingGame = {
      ...rejected,
      regeneration: {
        request_id: 'x',
        status: 'failed',
        error: 'e',
        requested_at: 'a',
        processed_at: 'b',
      },
    };
    expect(cellState(both).lines).toEqual([
      'Usa un ítem rechazado: CAP theorem',
      'Aprobado · Regeneración fallida: e',
    ]);
  });
});

describe('rowLabel y windowSubtitle (D1)', () => {
  it('formatea sin Date', () => {
    expect(rowLabel({ date: '2026-12-05', number: 35 })).toBe('05/12 #35');
    expect(windowSubtitle(UPCOMING_OK)).toBe(
      'Del 2026-12-02 al 2026-12-15 (UTC) · 3 juegos · hoy no se muestra',
    );
  });
});

describe('upcomingAlerts (TS-7)', () => {
  it('una falla para mañana y una regeneración fallida', () => {
    const combined = upcoming({
      '2026-12-02:devdle': {
        challenge: null,
        regeneration: null,
        failure: { attempts: 20, last_reason: 'no_valid_term', updated_at: '2026-12-01T09:10:00Z' },
      },
      '2026-12-05:grep-grid': cell(UPCOMING_REGEN_FAILED, '2026-12-05', 'grep-grid'),
    });
    expect(FAILURES_ONE.failures).toHaveLength(1);
    expect(upcomingAlerts(combined)).toEqual({
      failures:
        '1 juego no tiene desafío para mañana: Devdle (2026-12-02), falla tras 20 intentos. Se reintenta en la próxima corrida.',
      pending: false,
      regenFailed: [
        'No se pudo regenerar Grep Grid del 2026-12-05: ningún reemplazo pasó la verificación (overlap_conflict). Queda el actual.',
      ],
    });
  });

  it('dos fallas en días distintos', () => {
    const failure = { attempts: 20, last_reason: 'x', updated_at: 'u' };
    const data = upcoming({
      '2026-12-02:devdle': { challenge: null, regeneration: null, failure },
      '2026-12-04:timeline': { challenge: null, regeneration: null, failure },
    });
    expect(upcomingAlerts(data).failures).toBe(
      '2 juegos no tienen desafío: Devdle (2026-12-02), falla tras 20 intentos; Tech Timeline (2026-12-04), falla tras 20 intentos. Se reintenta en la próxima corrida.',
    );
  });

  it('sin avisos y con pendiente', () => {
    expect(upcomingAlerts(UPCOMING_OK)).toEqual({
      failures: null,
      pending: false,
      regenFailed: [],
    });
    expect(upcomingAlerts(UPCOMING_PENDING).pending).toBe(true);
    expect(upcomingAlerts(undefined).failures).toBeNull();
  });
});
