import { RouterProvider } from 'react-router';

import { registerApiHooks } from './api-hooks';
import { Providers } from './providers';
import { queryClient } from './query-client';
import { router } from './router';

registerApiHooks(queryClient);

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
