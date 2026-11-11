import { describe, expect, it, vi } from 'vitest';

import { QualityService } from '@/domain/quality/quality.service';
import { games } from '@/games/registry';

const player = { id: 'p1' } as never;
const body = { challenge_number: 8, reason: 'other' as const };
const log = { info: vi.fn() } as never;

const repo = {
  lockReportable: async () => ({ id: 'c1', status: 'published', alertedAt: null }),
  findPlay: async () => null,
  insertReportIfAbsent: async () => ({ id: 'r1' }),
  countThresholdReports: async () => 0,
  countFinishedPlays: async () => 0,
  markAlerted: async () => false,
};

const deadlock = () => Object.assign(new Error('deadlock'), { cause: { code: '40P01' } });

function build(runInTx: (fn: (r: never) => Promise<unknown>) => Promise<unknown>) {
  return new QualityService({
    games,
    runInTx: runInTx as never,
    clock: { now: () => new Date('2026-12-01T10:00:00Z') },
    thresholds: { count: 3, ratio: 0.05, ratioMinCount: 2 },
  });
}

describe('QualityService.report', () => {
  it('reintenta una vez ante deadlock 40P01', async () => {
    let calls = 0;
    const service = build(async (fn) => {
      calls += 1;
      if (calls === 1) throw deadlock();
      return fn(repo as never);
    });
    await expect(service.report('devdle', player, body, { locale: 'es' }, log)).resolves.toEqual({
      report_id: 'r1',
    });
    expect(calls).toBe(2);
  });

  it('un segundo deadlock se propaga', async () => {
    let calls = 0;
    const service = build(async () => {
      calls += 1;
      throw deadlock();
    });
    await expect(service.report('devdle', player, body, { locale: 'es' }, log)).rejects.toThrow(
      'deadlock',
    );
    expect(calls).toBe(2);
  });

  it('otros errores no se reintentan', async () => {
    let calls = 0;
    const service = build(async () => {
      calls += 1;
      throw new Error('boom');
    });
    await expect(service.report('devdle', player, body, { locale: 'es' }, log)).rejects.toThrow(
      'boom',
    );
    expect(calls).toBe(1);
  });
});
