import { createHash } from 'node:crypto';

import type { GeneratorHistory, RecentChallenge } from '@nerdose/core';

import type { BugHuntPayload } from '../definition';
import { PAYLOAD } from '../definition/test-fixtures';

import type { BuiltTemplate, Template } from './types';

export const D = '2027-03-15';

export const seed = (n: number): Uint8Array =>
  new Uint8Array(createHash('sha256').update(`bug-hunt-test-seed-${n}`).digest());

export const seedFrom = (prefix: string, n: number): Uint8Array =>
  new Uint8Array(createHash('sha256').update(`bug-hunt-test-seed-${prefix}-${n}`).digest());

export const payloadWith = (
  date: string,
  overrides: Partial<BugHuntPayload> = {},
): BugHuntPayload => ({
  ...PAYLOAD,
  ...overrides,
  date,
});

const probeSpec = { es: 'sonda', en: 'probe' };
const role = (es: string, en: string) => ({ es, en });

type ProbeOptions = {
  id: string;
  kind: 'max_index' | 'count_above';
  edge: readonly (readonly (number | readonly number[])[])[];
  sites: readonly ('start' | 'bound')[];
};

/** A one-combination template whose random inputs are just its edge cases (decision 17). */
function probe({ id, kind, edge, sites }: ProbeOptions): Template {
  return {
    id,
    combos: [{}],
    functionName: () => (kind === 'max_index' ? 'maxIndex' : 'countAbove'),
    build(_p, b): BuiltTemplate {
      const start = b.num(kind === 'max_index' ? 1 : 0);
      const bound = b.len(b.var('nums'));
      const cmp =
        kind === 'max_index'
          ? b.bin('>', b.index(b.var('nums'), b.var('i')), b.index(b.var('nums'), b.var('best')))
          : b.bin('>', b.index(b.var('nums'), b.var('i')), b.var('k'));
      const update =
        kind === 'max_index' ? b.assign('best', b.var('i')) : b.compound('count', '+=', b.num(1));
      const name = kind === 'max_index' ? 'best' : 'count';
      const func = b.func(
        kind === 'max_index' ? 'maxIndex' : 'countAbove',
        kind === 'max_index'
          ? [{ name: 'nums', type: 'int[]' }]
          : [
              { name: 'nums', type: 'int[]' },
              { name: 'k', type: 'int' },
            ],
        [
          b.let(name, b.num(0)),
          b.for(b.let('i', start), b.bin('<', b.var('i'), bound), b.inc('i'), [
            b.if(cmp, [update]),
          ]),
          b.return(b.var(name)),
        ],
        'int',
      );
      return {
        func,
        sites: [
          ...(sites.includes('start')
            ? [
                {
                  node: start.id,
                  operators: ['loop_start_shift' as const],
                  role: role('el inicio del recorrido', 'the start of the loop'),
                },
              ]
            : []),
          ...(sites.includes('bound')
            ? [
                {
                  node: bound.id,
                  operators: ['bound_minus_one' as const],
                  role: role('el límite del recorrido', 'the loop bound'),
                },
              ]
            : []),
        ],
      };
    },
    spec: () => probeSpec,
    edgeCases: () => edge,
    randomInput: (rng) => rng.pick(edge),
    reference(_p, input) {
      const nums = input[0] as readonly number[];
      if (kind === 'count_above') {
        return nums.filter((v) => v > (input[1] as number)).length;
      }
      let best = 0;
      nums.forEach((v, i) => {
        if (i > 0 && v > (nums[best] as number)) best = i;
      });
      return best;
    },
  };
}

const MAX_EDGE = [[[]], [[4]], [[3, 7, 2]], [[1, 9]]] as const;
const FEW_EDGE = [
  [[], 3],
  [[5], 3],
  [[1, 5], 3],
  [[5, 7], 3],
] as const;

/** `loop_start_shift` is always equivalent; `bound_minus_one` fails `[1, 9]` and passes 3. */
export const PROBE_EQUIV = probe({
  id: 'probe_equiv',
  kind: 'max_index',
  edge: MAX_EDGE,
  sites: ['start', 'bound'],
});
export const PROBE_ONLY_EQUIV = probe({
  id: 'probe_only_equiv',
  kind: 'max_index',
  edge: MAX_EDGE,
  sites: ['start'],
});
/** `loop_start_shift` passes 2; `bound_minus_one` passes only `[]`. */
export const PROBE_FEW = probe({
  id: 'probe_few',
  kind: 'count_above',
  edge: FEW_EDGE,
  sites: ['start', 'bound'],
});
export const PROBE_FEW_ONLY = probe({
  id: 'probe_few_only',
  kind: 'count_above',
  edge: FEW_EDGE,
  sites: ['bound'],
});
/** Both candidates are valid (3 passing tests each). */
export const PROBE_VARIETY = probe({
  id: 'probe_variety',
  kind: 'count_above',
  edge: [...FEW_EDGE, [[5, 1], 3], [[1, 1], 3]],
  sites: ['start', 'bound'],
});

export const emptyHistory: GeneratorHistory<BugHuntPayload> = {
  bankItems: [],
  recentChallenges: [],
};

export const recent = (date: string, payload: BugHuntPayload): RecentChallenge<BugHuntPayload> => ({
  date,
  payload,
});

/** A history row whose variety key is the one of (template, params, mutation). */
export const rowWithKey = (
  date: string,
  identity: Pick<BugHuntPayload, 'template' | 'params' | 'mutation'>,
): RecentChallenge<BugHuntPayload> => recent(date, payloadWith(date, identity));
