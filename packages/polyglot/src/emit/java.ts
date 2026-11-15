import { signatureOf } from '../tree/signature';
import type { Type } from '../tree/nodes';
import type { Dialect } from './dialect';

const TYPE_NAMES: Record<Type, string> = { int: 'int', 'int[]': 'int[]', bool: 'boolean' };

export const javaDialect: Dialect = {
  indent: '    ',
  terminator: ';',
  equals: '==',
  notEquals: '!=',
  signature: (f) => {
    const sig = signatureOf(f);
    const params = f.params.map((p, i) => `${TYPE_NAMES[sig.params[i] ?? 'int']} ${p}`);
    return `static ${TYPE_NAMES[sig.returns]} ${f.name}(${params.join(', ')}) {`;
  },
  declare: (name, value, type) => `${TYPE_NAMES[type]} ${name} = ${value}`,
  forHeader: (init, cond, step) => `for (${init}; ${cond}; ${step}) {`,
  whileHeader: (cond) => `while (${cond}) {`,
  ifHeader: (cond) => `if (${cond}) {`,
  len: (operand) => `${operand}.length`,
  half: (operand) => `${operand} / 2`,
  halfIsOperator: true,
  halfWrapsHalf: true,
};
