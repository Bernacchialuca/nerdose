import { createHash } from 'node:crypto';

import { AppError } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { AdminService, playerRef } from '@/domain/admin/admin.service';
import type { ChallengeRow, ReportRow } from '@/domain/admin/admin.repository';
import { games } from '@/games/registry';

import { captureLogger } from '../helpers/logger';
import { PAYLOAD } from '../helpers/db';
import {
  TEST_ADMIN_JWT_SECRET,
  TEST_ADMIN_PASSWORD,
  TEST_ADMIN_PASSWORD_HASH,
} from '../helpers/app';

const challenge = (id: string, date: string, alerted = false): ChallengeRow => ({
  id,
  gameId: 'devdle',
  date,
  number: 1,
  status: 'published',
  payload: PAYLOAD,
  verification: {},
  voidReason: null,
  voidedAt: null,
  alertedAt: alerted ? new Date('2026-12-01T00:00:00Z') : null,
});
const report = (challengeId: string, n: number): ReportRow =>
  ({
    id: `r-${challengeId}-${n}`,
    challengeId,
    playerId: `p-${n}`,
    reason: 'wrong_answer',
    message: null,
    locale: 'es',
    context: {},
    status: 'open',
    createdAt: new Date(2026, 11, 1, 0, n),
  }) as ReportRow;

function service(rows: ChallengeRow[], reports: ReportRow[]) {
  return new AdminService({
    passwordHash: TEST_ADMIN_PASSWORD_HASH,
    jwtSecret: TEST_ADMIN_JWT_SECRET,
    clock: { now: () => new Date('2026-12-01T12:00:00Z') },
    games,
    repo: {
      listReportsByStatus: async () => reports,
      findChallengesByIds: async () => rows,
      closeReportIfOpen: async () => null,
      reportExists: async () => false,
    },
  });
}

describe('AdminService', () => {
  it('login con reloj fijo y contraseña incorrecta', async () => {
    const svc = service([], []);
    const { logger } = captureLogger();
    expect((await svc.login(TEST_ADMIN_PASSWORD, logger)).expires_at).toBe(
      '2026-12-01T20:00:00.000Z',
    );
    await expect(svc.login('otra', logger)).rejects.toMatchObject({ code: 'invalid_credentials' });
    await expect(svc.login('otra', logger)).rejects.toBeInstanceOf(AppError);
  });

  it('ordena: alertado con menos reportes primero; empate por cantidad, fecha desc', async () => {
    const rows = [
      challenge('a', '2026-11-28', true),
      challenge('b', '2026-11-29'),
      challenge('c', '2026-11-30'),
      challenge('d', '2026-12-01'),
    ];
    const reports = [
      report('a', 1),
      ...[1, 2, 3, 4, 5].map((n) => report('b', n)),
      report('c', 1),
      report('c', 2),
      report('d', 1),
      report('d', 2),
    ];
    const { groups } = await service(rows, reports).listReportGroups('open');
    expect(groups.map((g) => g.challenge.id)).toEqual(['a', 'b', 'd', 'c']);
    expect(groups[1]).toMatchObject({ report_count: 5, reasons: { wrong_answer: 5 } });
  });

  it('playerRef son los primeros 8 hex del sha256', () => {
    const id = '0b9f1c3e-5a2d-4c1b-9e7f-2a6d8c4b1e01';
    expect(playerRef(id)).toBe(createHash('sha256').update(id).digest('hex').slice(0, 8));
  });
});
