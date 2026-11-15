import type { Dialect } from './dialect';

export const jsDialect: Dialect = {
  indent: '  ',
  terminator: ';',
  // `===` and `==` mean the same for integers; `===` is the idiomatic form in JS.
  equals: '===',
  notEquals: '!==',
  signature: (f) => `function ${f.name}(${f.params.join(', ')}) {`,
  declare: (name, value) => `let ${name} = ${value}`,
  forHeader: (init, cond, step) => `for (${init}; ${cond}; ${step}) {`,
  whileHeader: (cond) => `while (${cond}) {`,
  ifHeader: (cond) => `if (${cond}) {`,
  len: (operand) => `${operand}.length`,
  half: (operand) => `Math.trunc(${operand} / 2)`,
  halfIsOperator: false,
  halfWrapsHalf: false,
};
