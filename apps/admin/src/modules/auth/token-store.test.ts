import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SESSION, SESSION_KEY } from '@/test/fixtures/reports';

import { clearSession, getEndReason, readSession, subscribe, writeSession } from './token-store';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-11T12:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('token-store', () => {
  it('readSession devuelve la sesión vigente, null si venció o está corrupta (TS-3)', () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
    expect(readSession()).toEqual(SESSION);
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...SESSION, expires_at: '2026-11-11T11:59:59Z' }),
    );
    expect(readSession()).toBeNull();
    sessionStorage.setItem(SESSION_KEY, '{no-json');
    expect(readSession()).toBeNull();
  });

  it('notifica a los suscriptores y guarda el motivo del cierre (TS-4)', () => {
    const fn = vi.fn();
    const unsubscribe = subscribe(fn);
    writeSession(SESSION);
    clearSession('expired');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(getEndReason()).toBe('expired');
    writeSession(SESSION);
    expect(getEndReason()).toBeNull();
    unsubscribe();
    clearSession();
    expect(fn).toHaveBeenCalledTimes(3);
    expect(getEndReason()).toBe('logout');
  });

  it('solo escribe en sessionStorage', () => {
    writeSession(SESSION);
    expect(sessionStorage.getItem(SESSION_KEY)).toBe(JSON.stringify(SESSION));
    expect(localStorage.length).toBe(0);
  });
});
