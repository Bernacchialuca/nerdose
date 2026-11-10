import { en } from './en';
import { es } from './es';

/** Exported so `web` registers the bundles in its own i18next instance. */
export const i18n = { namespace: 'grep-grid', resources: { es, en } } as const;
