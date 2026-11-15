import { beforeAll, describe, expect, it } from 'vitest';
import {
  emitProgram,
  evaluate,
  LANGUAGES,
  replaceNode,
  runInLanguage,
  type CallArg,
  type FuncNode,
} from '../../src/index';
import { drains, maxIndex, rem, safe, treeA, treeB, treeC, treeD, treeE } from '../fixtures/trees';
import { requireToolchains } from './toolchains';

beforeAll(async () => {
  await requireToolchains();
});

const mutantGreaterEqual = replaceNode(maxIndex().tree, 'n16', (node, b) =>
  node.kind === 'bin' ? b.bin('>=', node.left, node.right) : node,
);
const mutantReturn = replaceNode(maxIndex().tree, 'n18', (_n, b) => b.return(b.var('i')));
const MAX_INDEX_CALLS: CallArg[][] = [[[5, 1, 5]], [[3, 7, 2]], [[]], [[-2, -9, -2]]];
const DRAINS_CALLS: CallArg[][] = [
  [[9], 3],
  [[3, 4, -5], 2],
  [[], 0],
  [[1, 1, 1], 2],
  [[-4, 2], 1],
];

describe('evaluate agrees with the real execution (S-047 TS-36)', () => {
  const cases: [string, FuncNode, CallArg[][]][] = [
    ['A', treeA().tree, [[0], [1], [8], [10]]],
    ['B', treeB(), [[1], [5], [10]]],
    ['C', treeC().tree, [[1], [8], [1024]]],
    ['D', treeD(), [[1], [2], [4], [8]]],
    [
      'E',
      treeE(),
      [
        [3, 9],
        [0, 0],
        [-3, 0],
      ],
    ],
    ['maxIndex', maxIndex().tree, MAX_INDEX_CALLS],
    ['drains', drains().tree, DRAINS_CALLS],
    ['rem', rem(), [[-4], [-3], [7]]],
    ['safe', safe(), [[[]], [[3]], [[-3]]]],
    ['maxIndex >=', mutantGreaterEqual, [[[5, 1, 5]], [[3, 7, 2]], [[1]]]],
    ['maxIndex return', mutantReturn, [[[5, 1, 5]], [[3, 7, 2]], [[1]]]],
  ];

  for (const [name, tree, calls] of cases) {
    it(`${name}: same output in js, go and java`, async () => {
      const outcomes = calls.map((args) => evaluate(tree, args));
      expect(outcomes.every((o) => o.ok)).toBe(true);
      const expected = `${outcomes.map((o) => String(o.ok ? o.value : '')).join('\n')}\n`;
      const results = await Promise.all(
        LANGUAGES.map((lang) => runInLanguage(lang, emitProgram(tree, lang, { calls }))),
      );
      for (const outcome of results) {
        expect(outcome.ok, name).toBe(true);
        expect(outcome.ok && outcome.stdout, name).toBe(expected);
      }
    });
  }
});
