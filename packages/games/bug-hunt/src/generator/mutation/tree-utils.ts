import type { Expr, FuncNode, NodeId, TreeNode } from '@nerdose/polyglot';

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

export function findNode(func: FuncNode, id: NodeId): TreeNode | undefined {
  const visit = (node: TreeNode): TreeNode | undefined => {
    if (node.id === id) return node;
    for (const child of childrenOf(node)) {
      const found = visit(child);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  return visit(func);
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
