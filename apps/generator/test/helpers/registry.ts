import { createGeneratorRegistry, generatorRegistry } from '@/games/registry';

export const devdleOnlyRegistry = createGeneratorRegistry([generatorRegistry.get('devdle')]);
