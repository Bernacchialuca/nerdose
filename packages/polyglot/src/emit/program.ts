import { assertIdentifier } from '../tree/identifiers';
import type { FuncNode } from '../tree/nodes';
import { emit } from './index';
import type { Language } from './languages';

export type ProgramOptions = { readonly calls: readonly (readonly number[])[] };
export type WrapOptions = ProgramOptions & { readonly entry: string };

const MIN_INT = -(2 ** 31);
const MAX_INT = 2 ** 31 - 1;

function assertCalls(calls: ProgramOptions['calls']): void {
  // Go does not compile an unused `import "fmt"`, so at least one call is required.
  if (calls.length === 0) throw new RangeError('calls_empty');
  for (const args of calls) {
    for (const arg of args) {
      // Java uses `int`, so every argument must fit in 32 bits.
      if (!Number.isInteger(arg) || arg < MIN_INT || arg > MAX_INT) {
        throw new RangeError(`invalid_argument: ${arg}`);
      }
    }
  }
}

/**
 * Wraps an already emitted function in the `main` of its language: one print line per call, in
 * the order of `calls`. The function is copied as is, with no instrumentation inside.
 */
export function wrapFunction(code: string, lang: Language, options: WrapOptions): string {
  assertIdentifier(options.entry);
  assertCalls(options.calls);
  const invocations = options.calls.map((args) => `${options.entry}(${args.join(', ')})`);
  switch (lang) {
    case 'js':
      return `${code}\n\n${invocations.map((c) => `console.log(${c});\n`).join('')}`;
    case 'go':
      return (
        `package main\n\nimport "fmt"\n\n${code}\n\nfunc main() {\n` +
        invocations.map((c) => `\tfmt.Println(${c})\n`).join('') +
        '}\n'
      );
    case 'java':
      return (
        `public class Main {\n${code}\n\n    public static void main(String[] args) {\n` +
        invocations.map((c) => `        System.out.println(${c});\n`).join('') +
        '    }\n}\n'
      );
  }
}

export function emitProgram(func: FuncNode, lang: Language, options: ProgramOptions): string {
  assertCalls(options.calls);
  for (const args of options.calls) {
    if (args.length !== func.params.length) {
      throw new RangeError(`arity_mismatch: expected ${func.params.length}, got ${args.length}`);
    }
  }
  return wrapFunction(emit(func, lang).code, lang, { entry: func.name, calls: options.calls });
}
