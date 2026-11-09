import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import '@/i18n';
import { App } from '@/app/app';
import { initAnalytics } from '@/lib/analytics';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

initAnalytics();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
