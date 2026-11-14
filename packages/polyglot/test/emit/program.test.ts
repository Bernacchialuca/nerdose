import { describe, expect, it } from 'vitest';
import { emit } from '../../src/emit/index';
import { LANGUAGES } from '../../src/emit/languages';
import { emitProgram, wrapFunction } from '../../src/emit/program';
import { treeA, treeB, treeE } from '../fixtures/trees';

const calls = [[1], [5], [10]];

describe('emitProgram', () => {
  it('builds the JS program (TS-17)', () => {
    expect(emitProgram(treeB(), 'js', { calls })).toBe(
      emit(treeB(), 'js').code +
        '\n\nconsole.log(f(1));\nconsole.log(f(5));\nconsole.log(f(10));\n',
    );
  });

  it('builds the Go program (TS-18)', () => {
    expect(emitProgram(treeB(), 'go', { calls })).toBe(
      'package main\n\nimport "fmt"\n\n' +
        emit(treeB(), 'go').code +
        '\n\nfunc main() {\n\tfmt.Println(f(1))\n\tfmt.Println(f(5))\n\tfmt.Println(f(10))\n}\n',
    );
  });

  it('builds the Java program (TS-19)', () => {
    expect(emitProgram(treeB(), 'java', { calls })).toBe(
      'public class Main {\n' +
        emit(treeB(), 'java').code +
        '\n\n    public static void main(String[] args) {\n        System.out.println(f(1));\n        System.out.println(f(5));\n        System.out.println(f(10));\n    }\n}\n',
    );
  });

  it('keeps the function as is and wrapFunction is equivalent (TS-20)', () => {
    for (const lang of LANGUAGES) {
      const { tree } = treeA();
      const code = emit(tree, lang).code;
      const program = emitProgram(tree, lang, { calls: [[0], [8]] });
      expect(program.includes(code)).toBe(true);
      expect(wrapFunction(code, lang, { entry: 'f', calls: [[0], [8]] })).toBe(program);
      expect(emitProgram(treeE(), lang, { calls: [[3, 9]] })).toContain('g(3, 9)');
    }
  });

  it('rejects invalid calls (TS-21)', () => {
    const { tree } = treeA();
    expect(() => emitProgram(tree, 'go', { calls: [] })).toThrow(new RangeError('calls_empty'));
    expect(() => emitProgram(tree, 'go', { calls: [[1.5]] })).toThrow(
      new RangeError('invalid_argument: 1.5'),
    );
    expect(() => emitProgram(tree, 'go', { calls: [[2 ** 31]] })).toThrow(
      new RangeError('invalid_argument: 2147483648'),
    );
    expect(() => emitProgram(tree, 'go', { calls: [[1, 2]] })).toThrow(
      new RangeError('arity_mismatch: expected 1, got 2'),
    );
    expect(() => wrapFunction('x', 'js', { entry: 'f', calls: [] })).toThrow(
      new RangeError('calls_empty'),
    );
    expect(() => emitProgram(tree, 'go', { calls: [[-2147483648]] })).not.toThrow();
  });
});
