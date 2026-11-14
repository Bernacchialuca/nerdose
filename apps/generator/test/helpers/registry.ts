import type { AnyGameGenerator } from '@nerdose/core';

import { createGeneratorRegistry, generatorRegistry, type GeneratorEntry } from '@/games/registry';

export const devdleOnlyRegistry = createGeneratorRegistry([generatorRegistry.get('devdle')]);

/** Entrada del registry con partes del generator reemplazadas (verify forzado, historySpec de prueba). */
export function withGenerator(
  entry: GeneratorEntry,
  overrides: Partial<AnyGameGenerator>,
): GeneratorEntry {
  return { ...entry, generator: { ...entry.generator, ...overrides } };
}
