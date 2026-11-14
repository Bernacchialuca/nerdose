import { AppError } from '@nerdose/core';
import { describe, expect, it, vi } from 'vitest';

import {
  RegenerationService,
  type RegenerationRepo,
} from '@/domain/publishing/regeneration.service';

const clock = { now: () => new Date('2026-12-01T10:00:00Z') };
const REQ = { id: 'r1', status: 'pending' as const, requestedAt: new Date('2026-12-01T09:00:00Z') };
const log = () => ({ info: vi.fn() }) as never;

function setup(over: Partial<RegenerationRepo> = {}) {
  const calls: string[] = [];
  const repo: RegenerationRepo = {
    findChallengeStatus: async () => (
      calls.push('find'),
      { id: 'c', status: 'approved', date: '2026-12-05' }
    ),
    insertPendingRequest: async () => (calls.push('insert'), REQ),
    findPendingRequest: async () => (calls.push('pending'), REQ),
    notify: async () => void calls.push('notify'),
    ...over,
  };
  const service = new RegenerationService({ runInTx: (fn) => fn(repo), clock });
  return { calls, service };
}

describe('RegenerationService', () => {
  it('orden find → insert → notify', async () => {
    const { calls, service } = setup();
    const l = log();
    await expect(service.regenerate('c', l)).resolves.toEqual({
      request_id: 'r1',
      status: 'pending',
      requested_at: '2026-12-01T09:00:00.000Z',
    });
    expect(calls).toEqual(['find', 'insert', 'notify']);
    expect((l as never as { info: ReturnType<typeof vi.fn> }).info.mock.calls[0]![0]).toMatchObject(
      {
        created: true,
      },
    );
  });

  it('con pedido existente: find pendiente, notify y created=false', async () => {
    const { calls, service } = setup({
      insertPendingRequest: async () => (calls.push('insert'), null),
    });
    const l = log();
    await service.regenerate('c', l);
    expect(calls).toEqual(['find', 'insert', 'pending', 'notify']);
    expect((l as never as { info: ReturnType<typeof vi.fn> }).info.mock.calls[0]![0]).toMatchObject(
      {
        created: false,
      },
    );
  });

  it('not_found y not_regenerable no insertan; date === today es 409', async () => {
    const insert = vi.fn();
    const a = setup({ findChallengeStatus: async () => null, insertPendingRequest: insert });
    await expect(a.service.regenerate('c', log())).rejects.toMatchObject({ code: 'not_found' });
    for (const row of [
      { id: 'c', status: 'published', date: '2026-12-05' },
      { id: 'c', status: 'approved', date: '2026-12-01' },
    ]) {
      const b = setup({ findChallengeStatus: async () => row, insertPendingRequest: insert });
      const err = await b.service.regenerate('c', log()).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(AppError);
      expect(err).toMatchObject({ code: 'not_regenerable' });
    }
    expect(insert).not.toHaveBeenCalled();
  });

  it('carrera: insert null, find null, segundo insert ok; y falla si sigue null', async () => {
    let n = 0;
    const ok = setup({
      insertPendingRequest: async () => (n++ === 0 ? null : REQ),
      findPendingRequest: async () => null,
    });
    await expect(ok.service.regenerate('c', log())).resolves.toMatchObject({ request_id: 'r1' });
    const bad = setup({
      insertPendingRequest: async () => null,
      findPendingRequest: async () => null,
    });
    await expect(bad.service.regenerate('c', log())).rejects.toThrow('regeneration request race');
  });
});
