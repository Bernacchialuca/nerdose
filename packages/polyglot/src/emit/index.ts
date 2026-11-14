import type { FuncNode } from '../tree/nodes';
import { goDialect } from './go';
import { javaDialect } from './java';
import { jsDialect } from './js';
import type { Language } from './languages';
import { print, type EmitResult } from './printer';

export type { EmitResult };

const DIALECTS = { js: jsDialect, go: goDialect, java: javaDialect } as const;

export function emit(func: FuncNode, lang: Language): EmitResult {
  return print(func, DIALECTS[lang]);
}
