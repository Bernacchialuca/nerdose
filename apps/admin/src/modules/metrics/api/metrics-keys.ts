export const metricsKeys = {
  all: ['admin', 'metrics'] as const,
  range: (from: string, to: string) => ['admin', 'metrics', from, to] as const,
};
