import { beforeAll, describe, expect, it } from 'vitest';
import {
  emitProgram,
  LANGUAGES,
  runInLanguage,
  type CallArg,
  type FuncNode,
} from '../../src/index';
import { drains, maxIndex, rem, safe } from '../fixtures/trees';
import { requireToolchains } from './toolchains';

beforeAll(async () => {
  await requireToolchains();
});

async function runAll(tree: FuncNode, calls: CallArg[][]) {
  return Promise.all(
    LANGUAGES.map((lang) => runInLanguage(lang, emitProgram(tree, lang, { calls }))),
  );
}

describe('typed code on real toolchains (S-047 TS-35)', () => {
  const cases: [string, FuncNode, CallArg[][], string][] = [
    ['maxIndex', maxIndex().tree, [[[5, 1, 5]], [[3, 7, 2]], [[]], [[-2, -9, -2]]], '0\n1\n0\n0\n'],
    [
      'drains',
      drains().tree,
      [
        [[9], 3],
        [[3, 4, -5], 2],
        [[], 0],
        [[1, 1, 1], 2],
        [[-4, 2], 1],
      ],
      'true\nfalse\nfalse\ntrue\nfalse\n',
    ],
    ['rem', rem(), [[-4], [-3], [7]], '0\n-1\n1\n'],
    ['safe', safe(), [[[]], [[3]], [[-3]]], 'false\ntrue\nfalse\n'],
  ];

  for (const [name, tree, calls, expected] of cases) {
    it(`${name} compiles and agrees in the 3 languages`, async () => {
      for (const outcome of await runAll(tree, calls)) {
        expect(outcome, name).toMatchObject({ ok: true, stdout: expected });
      }
    });
  }
});
