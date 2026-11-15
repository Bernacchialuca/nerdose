import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { arrayArg, elementAt, loc, NUMS, site } from './helpers';

const twoPointers = (p: TemplateParams) => p.style === 'two_pointers';
const MISMATCH_ROLE = loc(
  'la condición que detecta un par distinto',
  'the condition that spots a mismatched pair',
);

function buildTwoPointers(b: Parameters<Template['build']>[1]): BuiltTemplate {
  const init = b.num(0);
  const right = b.bin('-', b.len(b.var('nums')), b.num(1));
  const swapIdx = b.var('hi');
  const cond = b.bin('!=', elementAt(b, b.var('lo')), elementAt(b, swapIdx));
  const func = b.func(
    'isPalindrome',
    [NUMS],
    [
      b.let('lo', init),
      b.let('hi', right),
      b.while(b.bin('<', b.var('lo'), b.var('hi')), [
        b.if(cond, [b.return(b.bool(false))]),
        b.inc('lo'),
        b.compound('hi', '-=', b.num(1)),
      ]),
      b.return(b.bool(true)),
    ],
    'bool',
  );
  return {
    func,
    sites: [
      site(init.id, ['shift_init'], loc('el valor inicial de lo', 'the initial value of lo')),
      site(right.id, ['bound_minus_one'], loc('el extremo derecho', 'the right end')),
      site(cond.id, ['negate_condition'], MISMATCH_ROLE),
      site(
        swapIdx.id,
        ['swap_variable'],
        loc('el índice del segundo valor del par', 'the index of the second value of the pair'),
        { swaps: ['lo'] },
      ),
    ],
  };
}

function buildMirror(b: Parameters<Template['build']>[1]): BuiltTemplate {
  const init = b.bool(true);
  const mirror = b.bin('-', b.bin('-', b.len(b.var('nums')), b.num(1)), b.var('i'));
  const cond = b.bin('!=', elementAt(b, b.var('i')), elementAt(b, mirror));
  const update = b.assign('ok', b.bool(false));
  const startNode = b.num(0);
  const bound = b.half(b.len(b.var('nums')));
  const loop = b.for(b.let('i', startNode), b.bin('<', b.var('i'), bound), b.inc('i'), [
    b.if(cond, [update]),
  ]);
  const func = b.func(
    'isPalindrome',
    [NUMS],
    [b.let('ok', init, 'bool'), loop, b.return(b.var('ok'))],
    'bool',
  );
  return {
    func,
    sites: [
      site(init.id, ['flip_bool_init'], loc('el valor inicial de ok', 'the initial value of ok')),
      site(
        startNode.id,
        ['loop_start_shift'],
        loc('el inicio del recorrido', 'the start of the loop'),
      ),
      site(bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
      site(cond.id, ['negate_condition'], MISMATCH_ROLE),
      site(update.id, ['early_return'], loc('la actualización de ok', 'the update of ok'), {
        returns: ['ok'],
      }),
    ],
  };
}

export const isPalindrome: Template = {
  id: 'is_palindrome',
  combos: [{ style: 'two_pointers' }, { style: 'mirror' }],
  functionName: () => 'isPalindrome',
  build: (p, b) => (twoPointers(p) ? buildTwoPointers(b) : buildMirror(b)),
  spec: () => ({
    es: 'Devuelve true si nums se lee igual de izquierda a derecha que de derecha a izquierda; si no, false. Con nums vacío devuelve true.',
    en: 'Returns true if nums reads the same from left to right as from right to left; otherwise false. With an empty nums it returns true.',
  }),
  edgeCases: () => [[[]], [[7]], [[1, 2, 1]], [[1, 2, 2, 1]], [[1, 2, 3, 1]], [[4, 5]]],
  randomInput(rng): TestInput {
    if (rng.int(0, 1) === 0) {
      const half = randomArray(rng, 0, 3);
      const middle = rng.int(0, 1) === 1 ? [rng.int(-9, 20)] : [];
      return [[...half, ...middle, ...[...half].reverse()]];
    }
    return [randomArray(rng, 0, 7)];
  },
  reference(_p, input) {
    const nums = arrayArg(input);
    return nums.every((v, i) => v === nums[nums.length - 1 - i]);
  },
};
