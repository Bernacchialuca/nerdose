import { assertIdentifier } from './identifiers';
import type {
  AssignStmt,
  BinExpr,
  BinOp,
  CallExpr,
  CompoundOp,
  CompoundStmt,
  Expr,
  ForStmt,
  FuncNode,
  HalfExpr,
  IfStmt,
  IncStmt,
  LetStmt,
  NodeId,
  NumExpr,
  ReturnStmt,
  Stmt,
  StepStmt,
  VarExpr,
  WhileStmt,
} from './nodes';

const MAX_INT = 2 ** 31 - 1;

export type TreeBuilder = ReturnType<typeof createTreeBuilder>;

/**
 * Each builder owns its counter: two builders that build the same tree produce identical nodes.
 * Ids are assigned inside each constructor, after its children were created (arguments are
 * evaluated first), so children always get smaller ids than their parent.
 */
export function createTreeBuilder() {
  let counter = 0;
  const next = (): NodeId => `n${++counter}`;

  return {
    func(name: string, params: readonly string[], body: readonly Stmt[]): FuncNode {
      assertIdentifier(name);
      params.forEach(assertIdentifier);
      return { kind: 'func', id: next(), name, params, body };
    },
    let(name: string, expr: Expr): LetStmt {
      assertIdentifier(name);
      return { kind: 'let', id: next(), name, expr };
    },
    assign(name: string, expr: Expr): AssignStmt {
      assertIdentifier(name);
      return { kind: 'assign', id: next(), name, expr };
    },
    inc(name: string): IncStmt {
      assertIdentifier(name);
      return { kind: 'inc', id: next(), name };
    },
    compound(name: string, op: CompoundOp, expr: Expr): CompoundStmt {
      assertIdentifier(name);
      return { kind: 'compound', id: next(), name, op, expr };
    },
    for(init: LetStmt, cond: Expr, step: StepStmt, body: readonly Stmt[]): ForStmt {
      return { kind: 'for', id: next(), init, cond, step, body };
    },
    while(cond: Expr, body: readonly Stmt[]): WhileStmt {
      return { kind: 'while', id: next(), cond, body };
    },
    if(cond: Expr, then: readonly Stmt[]): IfStmt {
      return { kind: 'if', id: next(), cond, then };
    },
    return(expr: Expr): ReturnStmt {
      return { kind: 'return', id: next(), expr };
    },
    num(value: number): NumExpr {
      // Negatives are written with bin('-', ...): no negative literals that change precedence.
      if (!Number.isInteger(value) || value < 0 || value > MAX_INT) {
        throw new RangeError(`invalid_number: ${value}`);
      }
      return { kind: 'num', id: next(), value };
    },
    var(name: string): VarExpr {
      assertIdentifier(name);
      return { kind: 'var', id: next(), name };
    },
    bin(op: BinOp, left: Expr, right: Expr): BinExpr {
      return { kind: 'bin', id: next(), op, left, right };
    },
    half(expr: Expr): HalfExpr {
      return { kind: 'half', id: next(), expr };
    },
    call(name: string, args: readonly Expr[]): CallExpr {
      assertIdentifier(name);
      return { kind: 'call', id: next(), name, args };
    },
  };
}
