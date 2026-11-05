import { useContext } from 'react';

import { SessionContext } from './session-context';
import type { SessionContextValue } from './session-context';

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used within SessionProvider');
  return value;
}
