import { collectIds } from '../emit/printer';
import { assertModuloDivisor, createTreeBuilderAfter, type TreeBuilder } from './builder';
import type { Expr, ForStmt, FuncNode, LetStmt, NodeId, Stmt, StepStmt, TreeNode } from './nodes';
import { findNode, isExpr, isStmt, maxNodeId, walk } from './walk';

const isStep = (n: TreeNode): n is StepStmt =>
  n.kind === 'inc' || n.kind === 'compound' || n.kind === 'assign';
const isLet = (n: TreeNode): n is LetStmt => n.kind === 'let';

/**
 * Returns a new tree where the node `nodeId` is replaced by what `build` returns. Untouched nodes
 * (and the children `build` reuses) keep their ids; new nodes are numbered after the highest id of
 * the original tree. The original tree is never modified.
 */
export function replaceNode(
  func: FuncNode,
  nodeId: NodeId,
  build: (node: TreeNode, b: TreeBuilder) => TreeNode,
): FuncNode {
  const target = findNode(func, nodeId);
  if (target === undefined) throw new Error(`node_not_found: ${nodeId}`);
  if (target.kind === 'func') throw new Error(`replace_kind_mismatch: ${nodeId}`);
  const builder = createTreeBuilderAfter(maxNodeId(func));

  const pick = <T extends TreeNode>(node: TreeNode, accepts: (n: TreeNode) => n is T): T => {
    const replacement = build(node, builder);
    if (!accepts(replacement)) throw new Error(`replace_kind_mismatch: ${nodeId}`);
    return replacement;
  };

  const expr = (e: Expr): Expr => {
    if (e.id === nodeId) return pick(e, isExpr);
    switch (e.kind) {
      case 'bin':
        return { ...e, left: expr(e.left), right: expr(e.right) };
      case 'half':
        return { ...e, expr: expr(e.expr) };
      case 'call':
        return { ...e, args: e.args.map(expr) };
      case 'index':
        return { ...e, array: expr(e.array), index: expr(e.index) };
      case 'len':
        return { ...e, array: expr(e.array) };
      default:
        return e;
    }
  };

  const body = (list: readonly Stmt[]): Stmt[] => list.map(stmt);

  const stmt = (s: Stmt): Stmt => {
    if (s.id === nodeId) return pick(s, isStmt);
    switch (s.kind) {
      case 'let':
      case 'assign':
      case 'compound':
      case 'return':
        return { ...s, expr: expr(s.expr) };
      case 'inc':
        return s;
      case 'if':
        return { ...s, cond: expr(s.cond), then: body(s.then) };
      case 'while':
        return { ...s, cond: expr(s.cond), body: body(s.body) };
      case 'for':
        return forStmt(s);
    }
  };

  const forStmt = (s: ForStmt): ForStmt => {
    const init = s.init.id === nodeId ? pick(s.init, isLet) : (stmt(s.init) as LetStmt);
    const step = s.step.id === nodeId ? pick(s.step, isStep) : (stmt(s.step) as StepStmt);
    return { ...s, init, cond: expr(s.cond), step, body: body(s.body) };
  };

  const result: FuncNode = { ...func, body: body(func.body) };
  collectIds(result);
  walk(result, (n) => {
    if (n.kind === 'bin' && n.op === '%') assertModuloDivisor(n.right);
  });
  return result;
}
