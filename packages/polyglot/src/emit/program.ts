import { assertIdentifier } from '../tree/identifiers';
import { describeArg, isInt32 } from '../tree/int32';
import type { FuncNode, Signature, Type } from '../tree/nodes';
import { signatureOf } from '../tree/signature';
import { emit } from './index';
import type { Language } from './languages';

export type CallArg = number | readonly number[];
export type ProgramOptions = { readonly calls: readonly (readonly CallArg[])[] };
export type WrapOptions = ProgramOptions & {
  readonly entry: string;
  /** Types of the entry function. Without it every argument is a 32-bit integer. */
  readonly signature?: Signature;
};

function matchesType(arg: CallArg, type: Type | undefined): boolean {
  if (type === 'int[]') return Array.isArray(arg) && arg.every(isInt32);
  return isInt32(arg);
}

function assertCalls(calls: ProgramOptions['calls'], signature?: Signature): void {
  // Go does not compile an unused `import "fmt"`, so at least one call is required.
  if (calls.length === 0) throw new RangeError('calls_empty');
  for (const args of calls) {
    if (signature && args.length !== signature.params.length) {
      throw new RangeError(
        `arity_mismatch: expected ${signature.params.length}, got ${args.length}`,
      );
    }
    args.forEach((arg, i) => {
      // Java uses `int`, so every argument must fit in 32 bits.
      if (!matchesType(arg, signature?.params[i])) {
        throw new RangeError(`invalid_argument: ${describeArg(arg)}`);
      }
    });
  }
}

function literal(arg: CallArg, lang: Language): string {
  if (typeof arg === 'number') return String(arg);
  const items = arg.join(', ');
  switch (lang) {
    case 'js':
      return `[${items}]`;
    case 'go':
      return `[]int{${items}}`;
    case 'java':
      return `new int[]{${items}}`;
  }
}

/**
 * Wraps an already emitted function in the `main` of its language: one print line per call, in
 * the order of `calls`. The function is copied as is, with no instrumentation inside.
 */
export function wrapFunction(code: string, lang: Language, options: WrapOptions): string {
  assertIdentifier(options.entry);
  assertCalls(options.calls, options.signature);
  const invocations = options.calls.map(
    (args) => `${options.entry}(${args.map((a) => literal(a, lang)).join(', ')})`,
  );
  switch (lang) {
    case 'js':
      return `${code}\n\n${invocations.map((c) => (options.signature ? `console.log(String(${c}));\n` : `console.log(${c});\n`)).join('')}`;
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
  const code = emit(func, lang).code;
  if (func.paramTypes || func.returns) {
    return wrapFunction(code, lang, {
      entry: func.name,
      calls: options.calls,
      signature: signatureOf(func),
    });
  }
  assertCalls(options.calls);
  for (const args of options.calls) {
    if (args.length !== func.params.length) {
      throw new RangeError(`arity_mismatch: expected ${func.params.length}, got ${args.length}`);
    }
  }
  return wrapFunction(code, lang, { entry: func.name, calls: options.calls });
}
