import type { Dialect } from './dialect';

export const javaDialect: Dialect = {
  indent: '    ',
  terminator: ';',
  equals: '==',
  signature: (f) => `static int ${f.name}(${f.params.map((p) => `int ${p}`).join(', ')}) {`,
  declare: (name, value) => `int ${name} = ${value}`,
  forHeader: (init, cond, step) => `for (${init}; ${cond}; ${step}) {`,
  whileHeader: (cond) => `while (${cond}) {`,
  ifHeader: (cond) => `if (${cond}) {`,
  half: (operand) => `${operand} / 2`,
  halfIsOperator: true,
  halfWrapsHalf: true,
};
