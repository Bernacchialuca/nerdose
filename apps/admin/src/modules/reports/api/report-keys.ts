import type { ReportStatus } from '@nerdose/core';

export const reportKeys = {
  all: ['admin', 'reports'] as const,
  list: (status: ReportStatus) => ['admin', 'reports', status] as const,
};
