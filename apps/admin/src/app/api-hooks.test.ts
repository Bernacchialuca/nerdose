import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api, ApiError } from '@/lib/api-client';
import { getEndReason, writeSession } from '@/modules/auth/token-store';
import { SESSION, SESSION_KEY } from '@/test/fixtures/reports';
import { adminHandlers, apiError, requests, server } from '@/test/msw';

import { registerApiHooks } from './api-hooks';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-11T12:00:00Z'));
});

describe('registerApiHooks', () => {
  it('envía Bearer con la sesión y nada sin ella (TS-5)', async () => {
    registerApiHooks(new QueryClient());
    server.use(adminHandlers.reportsAny({ groups: [] }));
    await api('/api/admin/reports?status=open');
    expect(requests[0]?.headers.get('authorization')).toBeNull();
    writeSession(SESSION);
    await api('/api/admin/reports?status=open');
    expect(requests[1]?.headers.get('authorization')).toBe(`Bearer ${SESSION.token}`);
  });

  it('un 401 unauthorized borra token y cache (TS-6)', async () => {
    const qc = new QueryClient();
    qc.setQueryData(['admin', 'reports', 'open'], {});
    registerApiHooks(qc);
    writeSession(SESSION);
    server.use(
      adminHandlers.reportsAny(apiError('unauthorized', 'Sesión vencida'), { status: 401 }),
    );
    await expect(api('/api/admin/reports?status=open')).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(qc.getQueryCache().getAll()).toHaveLength(0);
    expect(getEndReason()).toBe('expired');
  });

  it('un 401 invalid_credentials no cierra la sesión (TS-7)', async () => {
    const qc = new QueryClient();
    qc.setQueryData(['x'], 1);
    registerApiHooks(qc);
    writeSession(SESSION);
    server.use(
      adminHandlers.login(apiError('invalid_credentials', 'Contraseña incorrecta'), {
        status: 401,
      }),
    );
    const error = await api('/api/admin/login', { method: 'POST', json: { password: 'x' } }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(getEndReason()).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(qc.getQueryCache().getAll()).toHaveLength(1);
  });
});
