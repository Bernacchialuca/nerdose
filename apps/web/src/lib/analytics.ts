import { injectAnalytics } from '@nerdose/ui';

import { env } from './env';
import type { Env } from './env';

/** Sin dominio no inyecta nada (ADR-014): `injectAnalytics` es un no-op en ese caso. */
export function initAnalytics(e: Env = env): void {
  injectAnalytics({ domain: e.VITE_PLAUSIBLE_DOMAIN, scriptUrl: e.VITE_PLAUSIBLE_SCRIPT_URL });
}
