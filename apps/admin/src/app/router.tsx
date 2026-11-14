import { createBrowserRouter, Navigate } from 'react-router';
import type { RouteObject } from 'react-router';

import { RequireAuth } from '@/modules/auth';

import { RouteError } from './route-error';
import { Shell } from './shell';

export const routes: RouteObject[] = [
  { path: '/login', lazy: () => import('@/modules/auth/routes/login') },
  {
    element: (
      <RequireAuth>
        <Shell />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/reports" replace /> },
      { path: 'reports', lazy: () => import('@/modules/reports/routes/reports') },
      { path: 'upcoming', lazy: () => import('@/modules/upcoming/routes/upcoming') },
      { path: 'content', lazy: () => import('@/modules/content-stock/routes/content') },
    ],
  },
];

export const router = createBrowserRouter(routes);
