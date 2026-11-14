import type { Dialect } from './dialect';

export const goDialect: Dialect = {
  indent: '\t',
  terminator: '',
  equals: '==',
  signature: (f) => `func ${f.name}(${f.params.map((p) => `${p} int`).join(', ')}) int {`,
  declare: (name, value) => `${name} := ${value}`,
  forHeader: (init, cond, step) => `for ${init}; ${cond}; ${step} {`,
  whileHeader: (cond) => `for ${cond} {`,
  ifHeader: (cond) => `if ${cond} {`,
  half: (operand) => `${operand} / 2`,
  halfIsOperator: true,
  halfWrapsHalf: true,
};
