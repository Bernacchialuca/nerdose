import { describe, expect, it } from 'vitest';
import { emit } from '../../src/emit/index';
import { LANGUAGES } from '../../src/emit/languages';
import { emitProgram, wrapFunction } from '../../src/emit/program';
import { drains, maxIndex, treeE } from '../fixtures/trees';

describe('typed programs', () => {
  const sig = { params: ['int[]' as const], returns: 'int' as const };

  it('wraps calls with array arguments (S-047 TS-30)', () => {
    const args = { entry: 'maxIndex', calls: [[[5, 1, 5]], [[]]], signature: sig };
    const code = (l: 'js' | 'go' | 'java') => emit(maxIndex().tree, l).code;
    expect(wrapFunction(code('js'), 'js', args)).toBe(
      `${code('js')}\n\nconsole.log(String(maxIndex([5, 1, 5])));\nconsole.log(String(maxIndex([])));\n`,
    );
    expect(wrapFunction(code('go'), 'go', args)).toBe(
      `package main\n\nimport "fmt"\n\n${code('go')}\n\nfunc main() {\n\tfmt.Println(maxIndex([]int{5, 1, 5}))\n\tfmt.Println(maxIndex([]int{}))\n}\n`,
    );
    expect(wrapFunction(code('java'), 'java', args)).toBe(
      `public class Main {\n${code('java')}\n\n    public static void main(String[] args) {\n        System.out.println(maxIndex(new int[]{5, 1, 5}));\n        System.out.println(maxIndex(new int[]{}));\n    }\n}\n`,
    );
  });

  it('prints negative scalars and booleans (S-047 TS-31)', () => {
    const options = {
      entry: 'drains',
      calls: [
        [[9], 3],
        [[-4, 2], -1],
      ],
      signature: { params: ['int[]' as const, 'int' as const], returns: 'bool' as const },
    };
    const wrap = (l: 'js' | 'go' | 'java') => wrapFunction(emit(drains().tree, l).code, l, options);
    expect(wrap('js')).toContain(
      'console.log(String(drains([9], 3)));\nconsole.log(String(drains([-4, 2], -1)));',
    );
    expect(wrap('go')).toContain(
      '\tfmt.Println(drains([]int{9}, 3))\n\tfmt.Println(drains([]int{-4, 2}, -1))',
    );
    expect(wrap('java')).toContain(
      '        System.out.println(drains(new int[]{9}, 3));\n        System.out.println(drains(new int[]{-4, 2}, -1));',
    );
  });

  it('takes the signature from the tree (S-047 TS-32)', () => {
    for (const lang of LANGUAGES) {
      expect(emitProgram(maxIndex().tree, lang, { calls: [[[5, 1, 5]]] })).toBe(
        wrapFunction(emit(maxIndex().tree, lang).code, lang, {
          entry: 'maxIndex',
          calls: [[[5, 1, 5]]],
          signature: sig,
        }),
      );
    }
  });

  it('validates typed calls (S-047 TS-33)', () => {
    const wrap = (calls: Parameters<typeof wrapFunction>[2]['calls']) => () =>
      wrapFunction('x', 'js', { entry: 'maxIndex', calls, signature: sig });
    expect(wrap([[5]])).toThrow(new RangeError('invalid_argument: 5'));
    expect(wrap([[[1.5]]])).toThrow(new RangeError('invalid_argument: [1.5]'));
    expect(wrap([[[2147483648]]])).toThrow(new RangeError('invalid_argument: [2147483648]'));
    expect(wrap([[[5], 1]])).toThrow(new RangeError('arity_mismatch: expected 1, got 2'));
    expect(wrap([])).toThrow(new RangeError('calls_empty'));
    expect(() => emitProgram(drains().tree, 'go', { calls: [[[1], [2]]] })).toThrow(
      new RangeError('invalid_argument: [2]'),
    );
  });

  it('does not change without a signature (S-047 TS-34)', () => {
    expect(wrapFunction('x', 'js', { entry: 'f', calls: [[1]] })).toBe('x\n\nconsole.log(f(1));\n');
    expect(() => wrapFunction('x', 'js', { entry: 'f', calls: [[[5, 1, 5]]] })).toThrow(
      new RangeError('invalid_argument: [5,1,5]'),
    );
    expect(emitProgram(treeE(), 'js', { calls: [[3, 9]] })).toContain('console.log(g(3, 9));');
  });
});
