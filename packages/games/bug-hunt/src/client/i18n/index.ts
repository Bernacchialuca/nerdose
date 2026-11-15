import { en } from './en';
import { es } from './es';

/** Exported so `web` registers the bundles in its own i18next instance. */
export const i18n = { namespace: 'bug-hunt', resources: { es, en } } as const;
