import { assertIdentifier } from './identifiers';
import { MAX_INT, MIN_INT } from './int32';
import type {
  AssignStmt,
  BinExpr,
  BinOp,
  BoolExpr,
  CallExpr,
  CompoundOp,
  CompoundStmt,
  Expr,
  ForStmt,
  FuncNode,
  HalfExpr,
  IfStmt,
  IncStmt,
  IndexExpr,
  LenExpr,
  LetStmt,
  NodeId,
  NumExpr,
  Param,
  ReturnStmt,
  ScalarType,
  Stmt,
  StepStmt,
  Type,
  VarExpr,
  WhileStmt,
} from './nodes';

export type TreeBuilder = ReturnType<typeof createTreeBuilderAfter>;

/**
 * Each builder owns its counter: two builders that build the same tree produce identical nodes.
 * Ids are assigned inside each constructor, after its children were created (arguments are
 * evaluated first), so children always get smaller ids than their parent.
 */
export function createTreeBuilder() {
  return createTreeBuilderAfter(0);
}

/** Same builder, numbering from `maxId + 1`: used to add nodes to an existing tree. */
export function createTreeBuilderAfter(maxId: number) {
  let counter = maxId;
  const next = (): NodeId => `n${++counter}`;

  return {
    func(
      name: string,
      params: readonly string[] | readonly Param[],
      body: readonly Stmt[],
      returns?: ScalarType,
    ): FuncNode {
      assertIdentifier(name);
      const typed = params.length > 0 && typeof params[0] !== 'string';
      if (typed) {
        const list = params as readonly Param[];
        const names = list.map((p) => p.name);
        names.forEach(assertIdentifier);
        return {
          kind: 'func',
          id: next(),
          name,
          params: names,
          paramTypes: list.map((p) => p.type),
          returns: returns ?? 'int',
          body,
        };
      }
      const names = params as readonly string[];
      names.forEach(assertIdentifier);
      if (returns === undefined) return { kind: 'func', id: next(), name, params: names, body };
      return { kind: 'func', id: next(), name, params: names, returns, body };
    },
    let(name: string, expr: Expr, type?: Type): LetStmt {
      assertIdentifier(name);
      if (type === undefined || type === 'int') return { kind: 'let', id: next(), name, expr };
      return { kind: 'let', id: next(), name, type, expr };
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
      if (!Number.isInteger(value) || value < MIN_INT || value > MAX_INT) {
        throw new RangeError(`invalid_number: ${value}`);
      }
      return { kind: 'num', id: next(), value };
    },
    var(name: string): VarExpr {
      assertIdentifier(name);
      return { kind: 'var', id: next(), name };
    },
    bool(value: boolean): BoolExpr {
      return { kind: 'bool', id: next(), value };
    },
    index(array: Expr, index: Expr): IndexExpr {
      return { kind: 'index', id: next(), array, index };
    },
    len(array: Expr): LenExpr {
      return { kind: 'len', id: next(), array };
    },
    bin(op: BinOp, left: Expr, right: Expr): BinExpr {
      if (op === '%') assertModuloDivisor(right);
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

export function assertModuloDivisor(divisor: Expr): void {
  if (divisor.kind !== 'num' || divisor.value <= 0) throw new RangeError('invalid_modulo_divisor');
}
