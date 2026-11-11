import { useQuery } from '@tanstack/react-query';
import type { ReportStatus } from '@nerdose/core';

import { api } from '@/lib/api-client';

import { reportKeys } from './report-keys';
import type { ReportGroupsResponse } from './types';

export function useReportGroups(status: ReportStatus) {
  return useQuery({
    queryKey: reportKeys.list(status),
    queryFn: () => api<ReportGroupsResponse>(`/api/admin/reports?status=${status}`),
  });
}
