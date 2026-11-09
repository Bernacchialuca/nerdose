import type { ReactNode } from 'react';
import type { Params } from 'react-router';

/**
 * Contrato entre las rutas y el `Shell`: una ruta puede aportar su propio header (D1). Así `app/`
 * no importa nada de los módulos y el header de juego queda fuera de `<main>`.
 */
export type ShellHandle = { header?: (params: Params<string>) => ReactNode | null };
