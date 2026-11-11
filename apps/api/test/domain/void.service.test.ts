import { describe, expect, it, vi } from 'vitest';

import type { VoidTxRepos } from '@/domain/quality/quality.types';
import { VoidService } from '@/domain/quality/void.service';
import { games } from '@/games/registry';

import { captureLogger } from '../helpers/logger';
import { PAYLOAD } from '../helpers/db';

const ID = '6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

function build(opts: { date?: string; status?: string; reloadFails?: boolean } = {}) {
  const calls: string[] = [];
  const quality = {
    lockChallengeForUpdate: async () => {
      calls.push('lock');
      return {
        id: ID,
        gameId: 'devdle' as const,
        date: opts.date ?? '2026-12-01',
        status: opts.status ?? 'published',
        payload: PAYLOAD,
      };
    },
    markVoided: async () => void calls.push('markVoided'),
    voidPlays: async () => {
      calls.push('voidPlays');
      return ['p1', 'p2'];
    },
    resolveOpenReports: async () => {
      calls.push('resolveOpenReports');
      return 1;
    },
    rejectTerm: async () => {
      calls.push('rejectTerm');
      return true;
    },
    rejectTimelineFact: async () => true,
  };
  const reload = vi.fn(async () => {
    if (opts.reloadFails) throw new Error('boom');
  });
  const service = new VoidService({
    games,
    runInTx: (fn) => fn({ quality, progress: {} } as unknown as VoidTxRepos),
    cache: { reload },
    progress: {
      recompute: async () => {
        calls.push('recompute');
        return { players: 2 };
      },
    },
    clock: { now: () => new Date('2026-12-01T12:00:00Z') },
  });
  return { service, calls, reload };
}

const TERM = { void_reason: 'x', culprit: { kind: 'term' as const, id: PAYLOAD.term_id } };

describe('VoidService', () => {
  it('orden: lock, culpable, markVoided, voidPlays, reportes, rechazo, recompute', async () => {
    const { service, calls, reload } = build();
    const { logger } = captureLogger();
    expect(await service.void(ID, TERM, logger)).toEqual({ challenge_id: ID, affected_plays: 2 });
    expect(calls).toEqual([
      'lock',
      'markVoided',
      'voidPlays',
      'resolveOpenReports',
      'rejectTerm',
      'recompute',
    ]);
    expect(reload).toHaveBeenCalledWith('2026-12-01');
  });

  it('not_voidable e invalid_culprit no escriben', async () => {
    const { logger } = captureLogger();
    const a = build({ status: 'approved' });
    await expect(a.service.void(ID, TERM, logger)).rejects.toMatchObject({ code: 'not_voidable' });
    expect(a.calls).toEqual(['lock']);
    const b = build();
    await expect(
      b.service.void(
        ID,
        { void_reason: 'x', culprit: { kind: 'term', id: '6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4e' } },
        logger,
      ),
    ).rejects.toMatchObject({ code: 'invalid_culprit' });
    expect(b.calls).toEqual(['lock']);
  });

  it('recarga la cache solo si el desafío es de hoy', async () => {
    const { service, reload } = build({ date: '2026-11-30' });
    await service.void(ID, TERM, captureLogger().logger);
    expect(reload).not.toHaveBeenCalled();
  });

  it('una recarga fallida deja 200 y loguea error', async () => {
    const { service } = build({ reloadFails: true });
    const captured = captureLogger();
    await expect(service.void(ID, TERM, captured.logger)).resolves.toMatchObject({
      affected_plays: 2,
    });
    expect(captured.lines().some((l) => l.level === 'error')).toBe(true);
  });
});
