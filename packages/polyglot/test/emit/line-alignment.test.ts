import { describe, expect, it } from 'vitest';
import { emit } from '../../src/emit/index';
import { LANGUAGES } from '../../src/emit/languages';
import type { Expr, FuncNode, NodeId, Stmt } from '../../src/tree/nodes';
import { allTrees } from '../fixtures/trees';

function allIds(func: FuncNode): NodeId[] {
  const ids: NodeId[] = [func.id];
  const expr = (e: Expr): void => {
    ids.push(e.id);
    if (e.kind === 'bin') {
      expr(e.left);
      expr(e.right);
    } else if (e.kind === 'half') expr(e.expr);
    else if (e.kind === 'call') e.args.forEach(expr);
    else if (e.kind === 'index') {
      expr(e.array);
      expr(e.index);
    } else if (e.kind === 'len') expr(e.array);
  };
  const stmt = (s: Stmt): void => {
    ids.push(s.id);
    if (s.kind === 'for') {
      ids.push(s.init.id);
      expr(s.init.expr);
      expr(s.cond);
      ids.push(s.step.id);
      if (s.step.kind !== 'inc') expr(s.step.expr);
      s.body.forEach(stmt);
    } else if (s.kind === 'while') {
      expr(s.cond);
      s.body.forEach(stmt);
    } else if (s.kind === 'if') {
      expr(s.cond);
      s.then.forEach(stmt);
    } else if (s.kind !== 'inc') expr(s.expr);
  };
  func.body.forEach(stmt);
  return ids;
}

describe('line alignment across languages (S-047 TS-10)', () => {
  for (const [name, tree] of Object.entries(allTrees())) {
    it(`tree ${name}: same lines and same lineOf in js, go and java`, () => {
      const [js, go, java] = LANGUAGES.map((l) => emit(tree, l)) as [
        ReturnType<typeof emit>,
        ReturnType<typeof emit>,
        ReturnType<typeof emit>,
      ];
      const count = (c: string) => c.split('\n').length;
      expect(count(go.code)).toBe(count(js.code));
      expect(count(java.code)).toBe(count(js.code));
      expect(go.lineOf).toEqual(js.lineOf);
      expect(java.lineOf).toEqual(js.lineOf);
      expect(Object.keys(js.lineOf).sort()).toEqual([...allIds(tree)].sort());
    });
  }
});
