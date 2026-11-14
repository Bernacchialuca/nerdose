import type { CodeLanguage } from '@nerdose/core';
import type { FuncNode, Stmt } from '@nerdose/polyglot';

export const MAX_LINES = 15;
export const MAX_NESTING = 3;
export const MAX_RECURSION_DEPTH = 20;

const INDENT: Record<CodeLanguage, string> = { js: '  ', go: '\t', java: '    ' };

/** Measures indentation (the emitter indents one level per block); it does not parse. */
export function measureCode(
  code: string,
  lang: CodeLanguage,
): { lines: number; nesting: number } {
  const unit = INDENT[lang];
  const lines = code.split('\n');
  let deepest = 0;
  for (const line of lines) {
    let level = 0;
    let rest = line;
    while (rest.startsWith(unit)) {
      level++;
      rest = rest.slice(unit.length);
    }
    deepest = Math.max(deepest, level);
  }
  return { lines: lines.length, nesting: Math.max(0, deepest - 1) };
}

const nestingOf = (body: readonly Stmt[]): number =>
  Math.max(
    0,
    ...body.map((s) => {
      switch (s.kind) {
        case 'for':
        case 'while':
          return 1 + nestingOf(s.body);
        case 'if':
          return 1 + nestingOf(s.then);
        default:
          return 0;
      }
    }),
  );

/** Max count of `for`/`while`/`if` that enclose a statement. */
export function treeNesting(func: FuncNode): number {
  return nestingOf(func.body);
}
