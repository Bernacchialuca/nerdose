import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

import type { GameId, Locale } from '@nerdose/core';

export type PreviewProps = { payload: unknown; language: Locale };

/** Copia estructural del contrato `./client` de un juego: solo lo que el admin usa. */
type PreviewClient = { Preview: ComponentType<PreviewProps> };

/**
 * Único lugar del admin que lista juegos. Cada client se baja recién cuando se abre
 * un detalle; un juego sin entrada acá cae a la vista genérica del payload.
 */
const clientRegistry: Partial<Record<GameId, () => Promise<PreviewClient>>> = {
  devdle: () => import('@nerdose/game-devdle/client'),
  'grep-grid': () => import('@nerdose/game-grep-grid/client'),
  timeline: () => import('@nerdose/game-timeline/client'),
};

export const hasPreview = (id: GameId): boolean => clientRegistry[id] !== undefined;

const cache = new Map<GameId, LazyExoticComponent<ComponentType<PreviewProps>>>();

export function previewComponent(id: GameId): LazyExoticComponent<ComponentType<PreviewProps>> {
  const cached = cache.get(id);
  if (cached) return cached;
  const load = clientRegistry[id];
  if (!load) throw new Error(`El juego ${id} no tiene Preview registrada`);
  const component = lazy(() => load().then((m) => ({ default: m.Preview })));
  cache.set(id, component);
  return component;
}
