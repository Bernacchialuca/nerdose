import type { BinOp, Expr, Stmt } from '@nerdose/polyglot';

const PRECEDENCE: Record<BinOp, number> = {
  '||': 1,
  '&&': 2,
  '==': 3,
  '!=': 3,
  '<': 4,
  '<=': 4,
  '>': 4,
  '>=': 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '%': 6,
};

export const precedenceOf = (op: BinOp): number => PRECEDENCE[op];

/** Language-neutral notation of an expression: `len(nums)`, `half(x)`, `==` (never `===`). */
export function neutralExpr(e: Expr): string {
  switch (e.kind) {
    case 'num':
      return String(e.value);
    case 'var':
      return e.name;
    case 'bool':
      return String(e.value);
    case 'len':
      return `len(${neutralExpr(e.array)})`;
    case 'half':
      return `half(${neutralExpr(e.expr)})`;
    case 'index':
      return `${neutralExpr(e.array)}[${neutralExpr(e.index)}]`;
    case 'call':
      return `${e.name}(${e.args.map(neutralExpr).join(', ')})`;
    case 'bin': {
      const p = PRECEDENCE[e.op];
      const left =
        e.left.kind === 'bin' && PRECEDENCE[e.left.op] < p
          ? `(${neutralExpr(e.left)})`
          : neutralExpr(e.left);
      const rightNeedsParens =
        (e.right.kind === 'bin' && PRECEDENCE[e.right.op] <= p) ||
        (e.right.kind === 'num' && e.right.value < 0);
      const right = rightNeedsParens ? `(${neutralExpr(e.right)})` : neutralExpr(e.right);
      return `${left} ${e.op} ${right}`;
    }
  }
}

/** Language-neutral notation of a statement header: `best = i`, `count += 1`, `lo++`. */
export function neutralStmt(s: Stmt): string {
  switch (s.kind) {
    case 'let':
      return `let ${s.name} = ${neutralExpr(s.expr)}`;
    case 'assign':
      return `${s.name} = ${neutralExpr(s.expr)}`;
    case 'compound':
      return `${s.name} ${s.op} ${neutralExpr(s.expr)}`;
    case 'inc':
      return `${s.name}++`;
    case 'return':
      return `return ${neutralExpr(s.expr)}`;
    case 'for':
      return `for (${neutralStmt(s.init)}; ${neutralExpr(s.cond)}; ${neutralStmt(s.step)})`;
    case 'while':
      return `while (${neutralExpr(s.cond)})`;
    case 'if':
      return `if (${neutralExpr(s.cond)})`;
  }
}
