import type { BigOOption } from '@nerdose/core';

import type { Shape } from './types';

type ComplexityClass = { degree: number; log: number };

const DC_CLASS: Record<string, ComplexityClass> = {
  '1-unit': { degree: 0, log: 1 },
  '1-linear': { degree: 1, log: 0 },
  '1-cubic': { degree: 3, log: 0 },
  '2-constant': { degree: 1, log: 0 },
  '2-linear': { degree: 1, log: 1 },
  '2-quadratic': { degree: 2, log: 0 },
  '4-unit': { degree: 2, log: 0 },
};

const MAPPING: Record<string, BigOOption> = {
  '0,0': 'o_1',
  '0,1': 'o_log_n',
  '1,0': 'o_n',
  '1,1': 'o_n_log_n',
  '2,0': 'o_n2',
  '3,0': 'o_n3',
};

function classOf(shape: Shape): ComplexityClass {
  switch (shape.kind) {
    case 'constant':
      return { degree: 0, log: 0 };
    case 'linear':
    case 'dependent':
      return { degree: 1, log: 0 };
    case 'doubling':
    case 'halving':
    case 'binary_search':
      return { degree: 0, log: 1 };
    case 'divide_and_conquer': {
      const cls = DC_CLASS[`${shape.calls}-${shape.work}`];
      if (cls === undefined) throw new Error(`big-o: unsupported_class dc(${shape.calls},${shape.work})`);
      return cls;
    }
    case 'double_recursion':
    case 'permutations':
      throw new Error(`big-o: unsupported_class ${shape.kind} is not composable`);
    case 'nest': {
      const a = classOf(shape.outer);
      const b = classOf(shape.inner);
      return { degree: a.degree + b.degree, log: a.log + b.log };
    }
    case 'seq':
      return shape.parts
        .map(classOf)
        .reduce((a, b) => (b.degree > a.degree || (b.degree === a.degree && b.log > a.log) ? b : a));
  }
}

/** Nesting multiplies `(degree, log)`; a sequence keeps the largest. */
export function deriveAnswer(shape: Shape): BigOOption {
  if (shape.kind === 'double_recursion') return 'o_2n';
  if (shape.kind === 'permutations') return 'o_n_fact';
  const cls = classOf(shape);
  const option = MAPPING[`${cls.degree},${cls.log}`];
  if (option === undefined) {
    throw new Error(`big-o: unsupported_class (${cls.degree},${cls.log})`);
  }
  return option;
}
