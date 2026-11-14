import { describe, expect, it, vi } from 'vitest';
import { emit } from '../../src/emit/index';
import { createTreeBuilder } from '../../src/tree/builder';
import { treeA, treeC, treeE } from '../fixtures/trees';

const JS_A = `function f(n) {
  let ops = 0;
  for (let i = 0; i < n; i++) {
    let j = n;
    while (j > 0) {
      ops += 2;
      j = Math.trunc(j / 2);
    }
    if (i === 0) {
      ops++;
    }
  }
  return ops;
}`;

const GO_A = `func f(n int) int {
\tops := 0
\tfor i := 0; i < n; i++ {
\t\tj := n
\t\tfor j > 0 {
\t\t\tops += 2
\t\t\tj = j / 2
\t\t}
\t\tif i == 0 {
\t\t\tops++
\t\t}
\t}
\treturn ops
}`;

const JAVA_A = `static int f(int n) {
    int ops = 0;
    for (int i = 0; i < n; i++) {
        int j = n;
        while (j > 0) {
            ops += 2;
            j = j / 2;
        }
        if (i == 0) {
            ops++;
        }
    }
    return ops;
}`;

describe('emit', () => {
  it('matches the JS golden of tree A (TS-7)', () => {
    expect(emit(treeA().tree, 'js').code).toBe(JS_A);
  });
  it('matches the Go golden of tree A (TS-8)', () => {
    expect(emit(treeA().tree, 'go').code).toBe(GO_A);
  });
  it('matches the Java golden of tree A (TS-9)', () => {
    expect(emit(treeA().tree, 'java').code).toBe(JAVA_A);
  });

  it('maps statements to their lines (TS-10)', () => {
    const { tree, nodes } = treeA();
    const { lineOf } = emit(tree, 'js');
    expect(lineOf[tree.id]).toBe(1);
    expect(lineOf[nodes.letOps.id]).toBe(2);
    expect(lineOf[nodes.forLoop.id]).toBe(3);
    expect(lineOf[nodes.letJ.id]).toBe(4);
    expect(lineOf[nodes.whileLoop.id]).toBe(5);
    expect(lineOf[nodes.compoundOps.id]).toBe(6);
    expect(lineOf[nodes.assignJ.id]).toBe(7);
    expect(lineOf[nodes.ifStmt.id]).toBe(9);
    expect(lineOf[nodes.incOps.id]).toBe(10);
    expect(lineOf[nodes.ret.id]).toBe(13);
  });

  it('puts expressions on the line of their statement (TS-12)', () => {
    const { tree, nodes } = treeC();
    const { lineOf } = emit(tree, 'js');
    const headerLine = lineOf[nodes.inner.id];
    expect(headerLine).toBe(4);
    expect(lineOf[nodes.innerCond.id]).toBe(headerLine);
    expect(lineOf[nodes.innerStep.id]).toBe(headerLine);
    expect(lineOf[nodes.two.id]).toBe(headerLine);
    expect(lineOf[nodes.retOps.id]).toBe(lineOf[nodes.ret.id]);
  });

  it('parenthesizes by precedence (TS-13)', () => {
    const build = (
      make: (b: ReturnType<typeof createTreeBuilder>) => import('../../src/tree/nodes').Expr,
    ) => {
      const b = createTreeBuilder();
      return b.func('f', ['a', 'b', 'c', 'n', 'x'], [b.return(make(b))]);
    };
    const cases: [
      string,
      (b: ReturnType<typeof createTreeBuilder>) => import('../../src/tree/nodes').Expr,
      string,
      string,
    ][] = [
      [
        'a',
        (b) => b.bin('*', b.var('x'), b.half(b.var('n'))),
        'x * Math.trunc(n / 2)',
        'x * (n / 2)',
      ],
      [
        'b',
        (b) => b.bin('-', b.var('a'), b.bin('-', b.var('b'), b.var('c'))),
        'a - (b - c)',
        'a - (b - c)',
      ],
      [
        'c',
        (b) => b.bin('-', b.bin('-', b.var('a'), b.var('b')), b.var('c')),
        'a - b - c',
        'a - b - c',
      ],
      [
        'd',
        (b) => b.bin('*', b.bin('+', b.var('a'), b.var('b')), b.var('c')),
        '(a + b) * c',
        '(a + b) * c',
      ],
      ['e', (b) => b.half(b.half(b.var('n'))), 'Math.trunc(Math.trunc(n / 2) / 2)', '(n / 2) / 2'],
    ];
    for (const [name, make, js, other] of cases) {
      const tree = build(make);
      expect(emit(tree, 'js').code.split('\n')[1], name).toBe(`  return ${js};`);
      expect(emit(tree, 'go').code.split('\n')[1], name).toBe(`\treturn ${other}`);
      expect(emit(tree, 'java').code.split('\n')[1], name).toBe(`    return ${other};`);
    }
  });

  it('is pure and deterministic (TS-14)', () => {
    const random = vi.spyOn(Math, 'random');
    const now = vi.spyOn(Date, 'now');
    for (const lang of ['js', 'go', 'java'] as const) {
      const { tree } = treeA();
      expect(emit(tree, lang)).toEqual(emit(tree, lang));
    }
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('rejects repeated ids (TS-15)', () => {
    const b = createTreeBuilder();
    const v = b.var('n');
    const tree = b.func('f', ['n'], [b.return(b.bin('+', v, v))]);
    expect(() => emit(tree, 'js')).toThrow(new Error('duplicate_node_id: n1'));
  });

  it('emits multi-parameter signatures (TS-16)', () => {
    const tree = treeE();
    expect(emit(tree, 'js').code).toBe(
      'function g(lo, hi) {\n  return Math.trunc((lo + hi) / 2);\n}',
    );
    expect(emit(tree, 'go').code).toBe('func g(lo int, hi int) int {\n\treturn (lo + hi) / 2\n}');
    expect(emit(tree, 'java').code).toBe(
      'static int g(int lo, int hi) {\n    return (lo + hi) / 2;\n}',
    );
  });
});
