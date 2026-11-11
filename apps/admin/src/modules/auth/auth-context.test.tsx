import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SESSION } from '@/test/fixtures/reports';

import { AuthProvider, useAuth } from './auth-context';
import { clearSession, writeSession } from './token-store';

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe('AuthProvider', () => {
  it('refleja la sesión y reacciona a escrituras externas', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-11T12:00:00Z'));
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor(new QueryClient()) });
    expect(result.current.isAuthenticated).toBe(false);
    act(() => {
      writeSession(SESSION);
    });
    expect(result.current.isAuthenticated).toBe(true);
    act(() => {
      clearSession('expired');
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.endReason).toBe('expired');
    vi.useRealTimers();
  });

  it('signOut descarta el token y limpia la cache', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-11T12:00:00Z'));
    const qc = new QueryClient();
    qc.setQueryData(['x'], 1);
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor(qc) });
    act(() => {
      result.current.signIn(SESSION);
    });
    act(() => {
      result.current.signOut();
    });
    expect(result.current.endReason).toBe('logout');
    expect(qc.getQueryCache().getAll()).toHaveLength(0);
    vi.useRealTimers();
  });

  it('useAuth fuera del provider lanza', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow('useAuth must be used within AuthProvider');
    vi.restoreAllMocks();
  });
});

function Probe() {
  useAuth();
  return null;
}
