import type { FuncNode, Signature } from './nodes';

/** Types of the parameters and of the return value, filling in `int` where the tree has none. */
export function signatureOf(func: FuncNode): Signature {
  return {
    params: func.params.map((_, i) => func.paramTypes?.[i] ?? 'int'),
    returns: func.returns ?? 'int',
  };
}
