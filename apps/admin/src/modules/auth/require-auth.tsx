import { Navigate, useLocation } from 'react-router';
import type { PropsWithChildren } from 'react';

import { useAuth } from './auth-context';

export function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
