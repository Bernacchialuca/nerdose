import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { writeSession } from '../token-store';

export type AdminLoginResponse = { token: string; expires_at: string };

export function useLogin() {
  return useMutation({
    mutationFn: (password: string) =>
      api<AdminLoginResponse>('/api/admin/login', { method: 'POST', json: { password } }),
    onSuccess: (session) => {
      writeSession(session);
    },
  });
}
