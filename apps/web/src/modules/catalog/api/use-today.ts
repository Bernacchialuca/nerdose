import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/modules/session';

import { fetchToday, todayKeys } from './today';

export function useToday() {
  const { locale } = useSession();
  return useQuery({ queryKey: todayKeys.detail(locale), queryFn: () => fetchToday(locale) });
}
