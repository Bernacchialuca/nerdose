import { createBrowserRouter } from 'react-router';
import type { RouteObject } from 'react-router';

import { NotFound } from '@/components/not-found';

import { RouteError } from './route-error';
import { Shell } from './shell';

export const routes: RouteObject[] = [
  {
    element: <Shell />,
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: () => import('@/modules/catalog/routes/home') },
      { path: 'about', lazy: () => import('@/modules/about/routes/about') },
      { path: ':game_id', lazy: () => import('@/modules/game-host/routes/game') },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
