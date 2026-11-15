import { createTreeBuilder } from '../../src/tree/builder';
import type { Expr, FuncNode, Stmt } from '../../src/tree/nodes';

const lit = (b: ReturnType<typeof createTreeBuilder>, n: number) => b.num(n);

/** A: let, for, while, compound, assign+half, if, inc, return. */
export function treeA() {
  const b = createTreeBuilder();
  const letOps = b.let('ops', lit(b, 0));
  const forInit = b.let('i', lit(b, 0));
  const forCond = b.bin('<', b.var('i'), b.var('n'));
  const forStep = b.inc('i');
  const letJ = b.let('j', b.var('n'));
  const whileCond = b.bin('>', b.var('j'), lit(b, 0));
  const compoundOps = b.compound('ops', '+=', lit(b, 2));
  const assignJ = b.assign('j', b.half(b.var('j')));
  const whileLoop = b.while(whileCond, [compoundOps, assignJ]);
  const ifStmt = b.if(b.bin('==', b.var('i'), lit(b, 0)), [b.inc('ops')]);
  const incOps = ifStmt.then[0] as Stmt;
  const forLoop = b.for(forInit, forCond, forStep, [letJ, whileLoop, ifStmt]);
  const ret = b.return(b.var('ops'));
  const tree = b.func('f', ['n'], [letOps, forLoop, ret]);
  return {
    tree,
    nodes: { letOps, forLoop, letJ, whileLoop, compoundOps, assignJ, ifStmt, incOps, ret },
  };
}

/** B: double recursion. */
export function treeB(): FuncNode {
  const b = createTreeBuilder();
  const guard = b.if(b.bin('<=', b.var('n'), lit(b, 1)), [b.return(lit(b, 1))]);
  const sum = b.bin(
    '+',
    b.call('f', [b.bin('-', b.var('n'), lit(b, 1))]),
    b.call('f', [b.bin('-', b.var('n'), lit(b, 2))]),
  );
  return b.func('f', ['n'], [guard, b.return(sum)]);
}

/** C: doubling inner loop. */
export function treeC() {
  const b = createTreeBuilder();
  const letOps = b.let('ops', lit(b, 0));
  const outerInit = b.let('i', lit(b, 0));
  const outerCond = b.bin('<', b.var('i'), b.var('n'));
  const outerStep = b.inc('i');
  const innerInit = b.let('j', lit(b, 1));
  const innerCond = b.bin('<', b.var('j'), b.var('n'));
  const two = lit(b, 2);
  const innerStep = b.compound('j', '*=', two);
  const incOps = b.inc('ops');
  const inner = b.for(innerInit, innerCond, innerStep, [incOps]);
  const outer = b.for(outerInit, outerCond, outerStep, [inner]);
  const retOps = b.var('ops');
  const ret = b.return(retOps);
  const tree = b.func('f', ['n'], [letOps, outer, ret]);
  return { tree, nodes: { inner, innerCond, innerStep, two, ret, retOps } };
}

/** D: divide and conquer. */
export function treeD(): FuncNode {
  const b = createTreeBuilder();
  const guard = b.if(b.bin('<=', b.var('n'), lit(b, 1)), [b.return(lit(b, 1))]);
  const letOps = b.let('ops', lit(b, 0));
  const loop = b.for(b.let('i', lit(b, 0)), b.bin('<', b.var('i'), b.var('n')), b.inc('i'), [
    b.inc('ops'),
  ]);
  const rec = (): Expr => b.call('f', [b.half(b.var('n'))]);
  const ret = b.return(b.bin('+', b.bin('+', b.var('ops'), rec()), rec()));
  return b.func('f', ['n'], [guard, letOps, loop, ret]);
}

/** E: two parameters. */
export function treeE(): FuncNode {
  const b = createTreeBuilder();
  return b.func('g', ['lo', 'hi'], [b.return(b.half(b.bin('+', b.var('lo'), b.var('hi'))))]);
}

/** maxIndex: int[] parameter, `len`, `index`, ids n1..n23 in this exact order. */
export function maxIndex() {
  const b = createTreeBuilder();
  const letBest = b.let('best', b.num(0));
  const init = b.let('i', b.num(1));
  const cond = b.bin('<', b.var('i'), b.len(b.var('nums')));
  const step = b.inc('i');
  const cmp = b.bin('>', b.index(b.var('nums'), b.var('i')), b.index(b.var('nums'), b.var('best')));
  const assign = b.assign('best', b.var('i'));
  const ifStmt = b.if(cmp, [assign]);
  const loop = b.for(init, cond, step, [ifStmt]);
  const ret = b.return(b.var('best'));
  const tree = b.func('maxIndex', [{ name: 'nums', type: 'int[]' }], [letBest, loop, ret], 'int');
  return { tree, nodes: { letBest, init, cond, step, cmp, assign, ifStmt, loop, ret } };
}

/** drains: bool, `&&`, `||`, `%`, `!=`, a negative literal, `-=`, `while` and a bool `let`. */
export function drains() {
  const b = createTreeBuilder();
  const found = b.let('found', b.bool(false), 'bool');
  const rest = b.let('rest', b.var('k'));
  const last = b.let('i', b.bin('-', b.len(b.var('nums')), b.num(1)));
  const cond = b.bin(
    '&&',
    b.bin('>=', b.var('i'), b.num(0)),
    b.bin('==', b.var('found'), b.bool(false)),
  );
  const odd = b.bin('!=', b.bin('%', b.index(b.var('nums'), b.var('i')), b.num(2)), b.num(0));
  const low = b.bin('<', b.index(b.var('nums'), b.var('i')), b.num(-1));
  const take = b.if(b.bin('||', odd, low), [
    b.compound('rest', '-=', b.index(b.var('nums'), b.var('i'))),
  ]);
  const flag = b.if(b.bin('<', b.var('rest'), b.num(0)), [b.assign('found', b.bool(true))]);
  const loop = b.while(cond, [take, flag, b.compound('i', '-=', b.num(1))]);
  const tree = b.func(
    'drains',
    [
      { name: 'nums', type: 'int[]' },
      { name: 'k', type: 'int' },
    ],
    [found, rest, last, loop, b.return(b.var('found'))],
    'bool',
  );
  return { tree, nodes: { found, rest, last, loop } };
}

export function rem(): FuncNode {
  const b = createTreeBuilder();
  return b.func('rem', [{ name: 'x', type: 'int' }], [b.return(b.bin('%', b.var('x'), b.num(2)))]);
}

export function safe(): FuncNode {
  const b = createTreeBuilder();
  const both = b.bin(
    '&&',
    b.bin('>', b.len(b.var('nums')), b.num(0)),
    b.bin('>', b.index(b.var('nums'), b.num(0)), b.num(0)),
  );
  return b.func('safe', [{ name: 'nums', type: 'int[]' }], [b.return(both)], 'bool');
}

export function allTrees(): Record<string, FuncNode> {
  return {
    A: treeA().tree,
    B: treeB(),
    C: treeC().tree,
    D: treeD(),
    E: treeE(),
    maxIndex: maxIndex().tree,
    drains: drains().tree,
    rem: rem(),
    safe: safe(),
  };
}
