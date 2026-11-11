import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import type { PropsWithChildren } from 'react';

import {
  clearSession,
  getEndReason,
  getSessionSnapshot,
  readSession,
  subscribe,
  writeSession,
} from './token-store';
import type { EndReason, Session } from './token-store';

type AuthState = {
  isAuthenticated: boolean;
  endReason: EndReason | null;
  signIn: (session: Session) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const snapshot = useSyncExternalStore(subscribe, getSessionSnapshot);
  const endReason = useSyncExternalStore(subscribe, getEndReason);
  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated: snapshot !== null && readSession() !== null,
      endReason,
      signIn: writeSession,
      signOut: () => {
        clearSession('logout');
        queryClient.clear();
      },
    }),
    [snapshot, endReason, queryClient],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
