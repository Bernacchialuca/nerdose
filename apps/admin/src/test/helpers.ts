import { vi } from 'vitest';

export const NOW = new Date('2026-11-11T12:00:00Z');

export function useFixedClock() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
}

export function useUpcomingClock() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-12-01T14:10:00Z'));
}
