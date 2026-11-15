import type { Expr, FuncNode, NodeId, Stmt } from '../tree/nodes';
import { walk } from '../tree/walk';
import type { Dialect, SimpleStmt } from './dialect';

export type EmitResult = {
  /** Lines joined with `\n`, with no trailing newline. */
  readonly code: string;
  /** 1-based line of every node of the tree (statements and expressions). */
  readonly lineOf: Record<NodeId, number>;
  /** Ascending 1-based lines where a statement starts (never the signature nor a closing `}`). */
  readonly statementLines: readonly number[];
};

const BIN_PREC: Record<string, number> = {
  '*': 3,
  '%': 3,
  '+': 2,
  '-': 2,
  '<': 1,
  '<=': 1,
  '>': 1,
  '>=': 1,
  '==': 1,
  '!=': 1,
  '&&': 0,
  '||': -1,
};
const COMPARISON_OPS: ReadonlySet<string> = new Set(['<', '<=', '>', '>=', '==', '!=']);
const HALF_OPERATOR_PREC = 3;
const ATOMIC_PREC = Infinity;

export function collectIds(func: FuncNode): void {
  const seen = new Set<NodeId>();
  walk(func, (n) => {
    if (seen.has(n.id)) throw new Error(`duplicate_node_id: ${n.id}`);
    seen.add(n.id);
  });
}

function isComparison(e: Expr): boolean {
  return e.kind === 'bin' && COMPARISON_OPS.has(e.op);
}

/**
 * One printer shared by the three languages: the line structure (what goes on which line) is
 * decided here, once, so every language gets the same line for each node by construction.
 */
export function print(func: FuncNode, dialect: Dialect): EmitResult {
  collectIds(func);
  const lines: string[] = [];
  const lineOf: Record<NodeId, number> = {};

  const prec = (e: Expr): number => {
    if (e.kind === 'bin') return BIN_PREC[e.op] ?? ATOMIC_PREC;
    if (e.kind === 'half') return dialect.halfIsOperator ? HALF_OPERATOR_PREC : ATOMIC_PREC;
    return ATOMIC_PREC;
  };

  const expr = (e: Expr): string => {
    switch (e.kind) {
      case 'num':
        return String(e.value);
      case 'var':
        return e.name;
      case 'bool':
        return String(e.value);
      case 'index':
        return `${expr(e.array)}[${expr(e.index)}]`;
      case 'len':
        return dialect.len(expr(e.array));
      case 'call':
        return `${e.name}(${e.args.map(expr).join(', ')})`;
      case 'half': {
        const wrap = e.expr.kind === 'bin' || (e.expr.kind === 'half' && dialect.halfWrapsHalf);
        const inner = expr(e.expr);
        return dialect.half(wrap ? `(${inner})` : inner);
      }
      case 'bin': {
        const op = e.op === '==' ? dialect.equals : e.op === '!=' ? dialect.notEquals : e.op;
        const bothCompare = COMPARISON_OPS.has(e.op);
        const wrapLeft = prec(e.left) < prec(e) || (bothCompare && isComparison(e.left));
        const wrapRight =
          prec(e.right) <= prec(e) ||
          (bothCompare && isComparison(e.right)) ||
          (e.right.kind === 'num' && e.right.value < 0);
        const left = wrapLeft ? `(${expr(e.left)})` : expr(e.left);
        const right = wrapRight ? `(${expr(e.right)})` : expr(e.right);
        return `${left} ${op} ${right}`;
      }
    }
  };

  const mark = (e: Expr, line: number): void => {
    walk(e, (n) => {
      lineOf[n.id] = line;
    });
  };

  const simple = (s: SimpleStmt): string => {
    switch (s.kind) {
      case 'let':
        return dialect.declare(s.name, expr(s.expr), s.type ?? 'int');
      case 'assign':
        return `${s.name} = ${expr(s.expr)}`;
      case 'inc':
        return `${s.name}++`;
      case 'compound':
        return `${s.name} ${s.op} ${expr(s.expr)}`;
      case 'return':
        return `return ${expr(s.expr)}`;
    }
  };

  const markSimple = (s: SimpleStmt, line: number): void => {
    lineOf[s.id] = line;
    if (s.kind !== 'inc') mark(s.expr, line);
  };

  const statementLines = new Set<number>();

  const emitLine = (depth: number, text: string, isStatement = false): number => {
    lines.push(dialect.indent.repeat(depth) + text);
    if (isStatement) statementLines.add(lines.length);
    return lines.length;
  };

  const block = (body: readonly Stmt[], depth: number): void => {
    body.forEach((s) => stmt(s, depth));
  };

  const stmt = (s: Stmt, depth: number): void => {
    switch (s.kind) {
      case 'for': {
        const header = dialect.forHeader(simple(s.init), expr(s.cond), simple(s.step));
        const line = emitLine(depth, header, true);
        lineOf[s.id] = line;
        markSimple(s.init, line);
        mark(s.cond, line);
        markSimple(s.step, line);
        block(s.body, depth + 1);
        emitLine(depth, '}');
        return;
      }
      case 'while': {
        const line = emitLine(depth, dialect.whileHeader(expr(s.cond)), true);
        lineOf[s.id] = line;
        mark(s.cond, line);
        block(s.body, depth + 1);
        emitLine(depth, '}');
        return;
      }
      case 'if': {
        const line = emitLine(depth, dialect.ifHeader(expr(s.cond)), true);
        lineOf[s.id] = line;
        mark(s.cond, line);
        block(s.then, depth + 1);
        emitLine(depth, '}');
        return;
      }
      default: {
        const line = emitLine(depth, simple(s) + dialect.terminator, true);
        markSimple(s, line);
      }
    }
  };

  lineOf[func.id] = emitLine(0, dialect.signature(func));
  block(func.body, 1);
  emitLine(0, '}');
  return {
    code: lines.join('\n'),
    lineOf,
    statementLines: [...statementLines].sort((x, y) => x - y),
  };
}
