import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { conditionOperators } from './conditions';
import { arrayArg, elementAt, indexLoop, loc, NUMS, site } from './helpers';

const KEY = {
  'ascending/false': 0,
  'ascending/true': 1,
  'descending/false': 2,
  'descending/true': 3,
};
const OP = ['>', '>=', '<', '<='] as const;
const NAME = [
  'isAscending',
  'isStrictlyAscending',
  'isDescending',
  'isStrictlyDescending',
] as const;
const PHRASE = [
  { es: 'mayor o igual que', en: 'greater than or equal to' },
  { es: 'mayor que', en: 'greater than' },
  { es: 'menor o igual que', en: 'less than or equal to' },
  { es: 'menor que', en: 'less than' },
] as const;

const index = (p: TemplateParams): number =>
  KEY[`${String(p.order)}/${String(p.strict)}` as keyof typeof KEY];

export const isSorted: Template = {
  id: 'is_sorted',
  combos: [
    { order: 'ascending', strict: false },
    { order: 'ascending', strict: true },
    { order: 'descending', strict: false },
    { order: 'descending', strict: true },
  ],
  functionName: (p) => NAME[index(p)] as string,
  build(p, b): BuiltTemplate {
    const cond = b.bin(
      OP[index(p)] as '>',
      elementAt(b, b.bin('-', b.var('i'), b.num(1))),
      elementAt(b, b.var('i')),
    );
    const loop = indexLoop(b, 1, [b.if(cond, [b.return(b.bool(false))])]);
    const func = b.func(
      NAME[index(p)] as string,
      [NUMS],
      [loop.stmt, b.return(b.bool(true))],
      'bool',
    );
    return {
      func,
      sites: [
        site(loop.bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
        site(
          cond.id,
          conditionOperators(cond),
          loc(
            'la condición que detecta un par fuera de orden',
            'the condition that spots a pair out of order',
          ),
        ),
      ],
    };
  },
  spec(p) {
    const phrase = PHRASE[index(p)] as { es: string; en: string };
    return {
      es: `Devuelve true si cada elemento de nums es ${phrase.es} el anterior; si no, false. Con 0 o 1 elementos devuelve true.`,
      en: `Returns true if each element of nums is ${phrase.en} the previous one; otherwise false. With 0 or 1 elements it returns true.`,
    };
  },
  edgeCases: (p) =>
    p.order === 'ascending'
      ? [[[]], [[3]], [[1, 2, 2, 5]], [[1, 3, 2]], [[5, 5]], [[9, 4, 1]]]
      : [[[]], [[3]], [[5, 2, 2, 1]], [[5, 3, 8]], [[5, 5]], [[1, 4, 9]]],
  randomInput(rng, p): TestInput {
    const descending = p.order === 'descending';
    if (rng.int(0, 1) === 0) {
      let nums: number[];
      if (p.strict) {
        let value = rng.int(-9, 5);
        nums = Array.from({ length: rng.int(0, 7) }, () => (value += rng.int(1, 2)));
      } else {
        nums = randomArray(rng, 0, 7).sort((a, b) => a - b);
      }
      return [descending ? nums.reverse() : nums];
    }
    return [randomArray(rng, 0, 7)];
  },
  reference(p, input) {
    const nums = arrayArg(input);
    for (let i = 1; i < nums.length; i++) {
      const prev = nums[i - 1] as number;
      const cur = nums[i] as number;
      const ok =
        p.order === 'ascending'
          ? p.strict
            ? cur > prev
            : cur >= prev
          : p.strict
            ? cur < prev
            : cur <= prev;
      if (!ok) return false;
    }
    return true;
  },
};
