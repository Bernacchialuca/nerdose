import { signatureOf } from '../tree/signature';
import type { Type } from '../tree/nodes';
import type { Dialect } from './dialect';

const TYPE_NAMES: Record<Type, string> = { int: 'int', 'int[]': '[]int', bool: 'bool' };

export const goDialect: Dialect = {
  indent: '\t',
  terminator: '',
  equals: '==',
  notEquals: '!=',
  signature: (f) => {
    const sig = signatureOf(f);
    const params = f.params.map((p, i) => `${p} ${TYPE_NAMES[sig.params[i] ?? 'int']}`);
    return `func ${f.name}(${params.join(', ')}) ${TYPE_NAMES[sig.returns]} {`;
  },
  declare: (name, value) => `${name} := ${value}`,
  forHeader: (init, cond, step) => `for ${init}; ${cond}; ${step} {`,
  whileHeader: (cond) => `for ${cond} {`,
  ifHeader: (cond) => `if ${cond} {`,
  len: (operand) => `len(${operand})`,
  half: (operand) => `${operand} / 2`,
  halfIsOperator: true,
  halfWrapsHalf: true,
};
