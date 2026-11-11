import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { reportKeys } from './report-keys';
import type { AdminReport } from './types';

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ report_id, status }: { report_id: string; status: 'resolved' | 'dismissed' }) =>
      api<AdminReport>(`/api/admin/reports/${report_id}`, { method: 'PATCH', json: { status } }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: reportKeys.all }),
  });
}
