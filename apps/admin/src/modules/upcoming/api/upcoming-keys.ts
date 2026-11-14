export const UPCOMING_DAYS = 14;
export const POLL_INTERVAL_MS = 5_000;

export const upcomingKeys = {
  all: ['admin', 'upcoming'] as const,
  list: (days: number) => ['admin', 'upcoming', days] as const,
};

export const failureKeys = {
  all: ['admin', 'generation-failures'] as const,
};
