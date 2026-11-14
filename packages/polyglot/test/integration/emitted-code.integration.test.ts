import { beforeAll, describe, expect, it } from 'vitest';
import { emitProgram, LANGUAGES, runInLanguage, type FuncNode } from '../../src/index';
import { treeA, treeB, treeC, treeD, treeE } from '../fixtures/trees';
import { requireToolchains } from './toolchains';

beforeAll(async () => {
  await requireToolchains();
});

async function runAll(tree: FuncNode, calls: number[][]) {
  return Promise.all(
    LANGUAGES.map((lang) => runInLanguage(lang, emitProgram(tree, lang, { calls }))),
  );
}

describe('emitted code on real toolchains', () => {
  it('tree A runs the same in the 3 languages (TS-30)', async () => {
    for (const outcome of await runAll(treeA().tree, [[0], [1], [8], [10]])) {
      expect(outcome).toMatchObject({ ok: true, stdout: '0\n3\n65\n81\n' });
      if (outcome.ok)
        expect(Number.isInteger(outcome.durationMs) && outcome.durationMs >= 0).toBe(true);
    }
  });

  it('all trees compile and agree (TS-31)', async () => {
    const cases: [string, FuncNode, number[][], string][] = [
      ['B', treeB(), [[1], [5], [10]], '1\n8\n89\n'],
      ['C', treeC().tree, [[1], [8], [1024]], '0\n24\n10240\n'],
      ['D', treeD(), [[1], [2], [4], [8]], '1\n4\n12\n32\n'],
      [
        'E',
        treeE(),
        [
          [3, 9],
          [0, 0],
        ],
        '6\n0\n',
      ],
    ];
    for (const [name, tree, calls, expected] of cases) {
      const outcomes = await runAll(tree, calls);
      for (const outcome of outcomes) {
        expect(outcome, name).toMatchObject({ ok: true, stdout: expected });
      }
    }
  });
});
