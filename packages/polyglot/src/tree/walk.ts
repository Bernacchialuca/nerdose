import type { Expr, FuncNode, NodeId, Stmt, TreeNode } from './nodes';

/** Direct children of a node, in emission order. */
export function childrenOf(node: TreeNode): readonly TreeNode[] {
  switch (node.kind) {
    case 'func':
      return node.body;
    case 'num':
    case 'var':
    case 'bool':
    case 'inc':
      return [];
    case 'bin':
      return [node.left, node.right];
    case 'half':
      return [node.expr];
    case 'call':
      return node.args;
    case 'index':
      return [node.array, node.index];
    case 'len':
      return [node.array];
    case 'let':
    case 'assign':
    case 'compound':
    case 'return':
      return [node.expr];
    case 'for':
      return [node.init, node.cond, node.step, ...node.body];
    case 'while':
      return [node.cond, ...node.body];
    case 'if':
      return [node.cond, ...node.then];
  }
}

/** Visits `node` and all its descendants, parents before children, in emission order. */
export function walk(node: TreeNode, visit: (node: TreeNode) => void): void {
  visit(node);
  for (const child of childrenOf(node)) walk(child, visit);
}

export function findNode(func: FuncNode, id: NodeId): TreeNode | undefined {
  let found: TreeNode | undefined;
  walk(func, (n) => {
    if (found === undefined && n.id === id) found = n;
  });
  return found;
}

export function maxNodeId(func: FuncNode): number {
  let max = 0;
  walk(func, (n) => {
    max = Math.max(max, Number(n.id.slice(1)));
  });
  return max;
}

export function isExpr(node: TreeNode): node is Expr {
  switch (node.kind) {
    case 'num':
    case 'var':
    case 'bool':
    case 'bin':
    case 'half':
    case 'call':
    case 'index':
    case 'len':
      return true;
    default:
      return false;
  }
}

export function isStmt(node: TreeNode): node is Stmt {
  return node.kind !== 'func' && !isExpr(node);
}
