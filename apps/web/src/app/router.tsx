import { createBrowserRouter } from 'react-router';
import type { RouteObject } from 'react-router';

import { RouteError } from './route-error';
import { Shell } from './shell';

export const routes: RouteObject[] = [
  { path: '/', element: <Shell />, errorElement: <RouteError /> },
];

export const router = createBrowserRouter(routes);
