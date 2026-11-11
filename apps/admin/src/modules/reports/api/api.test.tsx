import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';

import { DEVDLE_ID, OPEN_GROUPS, R1 } from '@/test/fixtures/reports';
import { adminHandlers, apiError, requests, server } from '@/test/msw';

import { reportKeys } from './report-keys';
import { useReportGroups } from './use-report-groups';
import { useUpdateReport } from './use-update-report';
import { useVoidChallenge } from './use-void-challenge';

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('reports api', () => {
  it('useReportGroups pide el estado en la query', async () => {
    server.use(adminHandlers.reports('resolved', OPEN_GROUPS));
    const { wrapper } = setup();
    const { result } = renderHook(() => useReportGroups('resolved'), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(requests[0]?.method).toBe('GET');
    expect(requests[0]?.search).toBe('?status=resolved');
  });

  it('useUpdateReport manda el body e invalida tras éxito y tras report_not_open', async () => {
    server.use(adminHandlers.patchReport(R1.id, { ...R1, status: 'resolved' }));
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(reportKeys.list('open'), OPEN_GROUPS);
    const { result } = renderHook(() => useUpdateReport(), { wrapper });
    await act(() => result.current.mutateAsync({ report_id: R1.id, status: 'resolved' }));
    expect(requests[0]?.body).toEqual({ status: 'resolved' });
    expect(queryClient.getQueryState(reportKeys.list('open'))?.isInvalidated).toBe(true);

    queryClient.setQueryData(reportKeys.list('open'), OPEN_GROUPS);
    server.use(adminHandlers.patchReport(R1.id, apiError('report_not_open', 'x'), { status: 409 }));
    await act(() =>
      result.current.mutateAsync({ report_id: R1.id, status: 'dismissed' }).catch(() => undefined),
    );
    expect(queryClient.getQueryState(reportKeys.list('open'))?.isInvalidated).toBe(true);
  });

  it('useVoidChallenge manda el body e invalida; no invalida ante 401', async () => {
    server.use(
      adminHandlers.voidChallenge(DEVDLE_ID, { challenge_id: DEVDLE_ID, affected_plays: 3 }),
    );
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(reportKeys.list('open'), OPEN_GROUPS);
    const { result } = renderHook(() => useVoidChallenge(), { wrapper });
    await act(() =>
      result.current.mutateAsync({
        challenge_id: DEVDLE_ID,
        void_reason: 'x',
        culprit: { kind: 'template' },
      }),
    );
    expect(requests[0]?.body).toEqual({ void_reason: 'x', culprit: { kind: 'template' } });
    expect(queryClient.getQueryState(reportKeys.list('open'))?.isInvalidated).toBe(true);

    queryClient.setQueryData(reportKeys.list('open'), OPEN_GROUPS);
    server.use(
      adminHandlers.voidChallenge(DEVDLE_ID, apiError('unauthorized', 'x'), { status: 401 }),
    );
    await act(() =>
      result.current
        .mutateAsync({ challenge_id: DEVDLE_ID, void_reason: 'x', culprit: { kind: 'none' } })
        .catch(() => undefined),
    );
    expect(queryClient.getQueryState(reportKeys.list('open'))?.isInvalidated).toBe(false);
  });
});
