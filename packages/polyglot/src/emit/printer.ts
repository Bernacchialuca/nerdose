import type { Expr, FuncNode, NodeId, Stmt } from '../tree/nodes';
import type { Dialect, SimpleStmt } from './dialect';

export type EmitResult = {
  /** Lines joined with `\n`, with no trailing newline. */
  readonly code: string;
  /** 1-based line of every node of the tree (statements and expressions). */
  readonly lineOf: Record<NodeId, number>;
};

const BIN_PREC: Record<string, number> = { '*': 3, '+': 2, '-': 2 };
const COMPARISON_PREC = 1;
const HALF_OPERATOR_PREC = 3;
const ATOMIC_PREC = Infinity;

export function collectIds(func: FuncNode): void {
  const seen = new Set<NodeId>();
  const see = (id: NodeId): void => {
    if (seen.has(id)) throw new Error(`duplicate_node_id: ${id}`);
    seen.add(id);
  };
  const expr = (e: Expr): void => {
    see(e.id);
    if (e.kind === 'bin') {
      expr(e.left);
      expr(e.right);
    } else if (e.kind === 'half') expr(e.expr);
    else if (e.kind === 'call') e.args.forEach(expr);
  };
  const stmt = (s: Stmt): void => {
    see(s.id);
    switch (s.kind) {
      case 'for':
        stmt(s.init);
        expr(s.cond);
        stmt(s.step);
        s.body.forEach(stmt);
        break;
      case 'while':
        expr(s.cond);
        s.body.forEach(stmt);
        break;
      case 'if':
        expr(s.cond);
        s.then.forEach(stmt);
        break;
      case 'inc':
        break;
      default:
        expr(s.expr);
    }
  };
  see(func.id);
  func.body.forEach(stmt);
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
    if (e.kind === 'bin') return BIN_PREC[e.op] ?? COMPARISON_PREC;
    if (e.kind === 'half') return dialect.halfIsOperator ? HALF_OPERATOR_PREC : ATOMIC_PREC;
    return ATOMIC_PREC;
  };

  const expr = (e: Expr): string => {
    switch (e.kind) {
      case 'num':
        return String(e.value);
      case 'var':
        return e.name;
      case 'call':
        return `${e.name}(${e.args.map(expr).join(', ')})`;
      case 'half': {
        const wrap = e.expr.kind === 'bin' || (e.expr.kind === 'half' && dialect.halfWrapsHalf);
        const inner = expr(e.expr);
        return dialect.half(wrap ? `(${inner})` : inner);
      }
      case 'bin': {
        const op = e.op === '==' ? dialect.equals : e.op;
        const left = prec(e.left) < prec(e) ? `(${expr(e.left)})` : expr(e.left);
        const right = prec(e.right) <= prec(e) ? `(${expr(e.right)})` : expr(e.right);
        return `${left} ${op} ${right}`;
      }
    }
  };

  const mark = (e: Expr, line: number): void => {
    lineOf[e.id] = line;
    if (e.kind === 'bin') {
      mark(e.left, line);
      mark(e.right, line);
    } else if (e.kind === 'half') mark(e.expr, line);
    else if (e.kind === 'call') e.args.forEach((a) => mark(a, line));
  };

  const simple = (s: SimpleStmt): string => {
    switch (s.kind) {
      case 'let':
        return dialect.declare(s.name, expr(s.expr));
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

  const emitLine = (depth: number, text: string): number => {
    lines.push(dialect.indent.repeat(depth) + text);
    return lines.length;
  };

  const block = (body: readonly Stmt[], depth: number): void => {
    body.forEach((s) => stmt(s, depth));
  };

  const stmt = (s: Stmt, depth: number): void => {
    switch (s.kind) {
      case 'for': {
        const header = dialect.forHeader(simple(s.init), expr(s.cond), simple(s.step));
        const line = emitLine(depth, header);
        lineOf[s.id] = line;
        markSimple(s.init, line);
        mark(s.cond, line);
        markSimple(s.step, line);
        block(s.body, depth + 1);
        emitLine(depth, '}');
        return;
      }
      case 'while': {
        const line = emitLine(depth, dialect.whileHeader(expr(s.cond)));
        lineOf[s.id] = line;
        mark(s.cond, line);
        block(s.body, depth + 1);
        emitLine(depth, '}');
        return;
      }
      case 'if': {
        const line = emitLine(depth, dialect.ifHeader(expr(s.cond)));
        lineOf[s.id] = line;
        mark(s.cond, line);
        block(s.then, depth + 1);
        emitLine(depth, '}');
        return;
      }
      default: {
        const line = emitLine(depth, simple(s) + dialect.terminator);
        markSimple(s, line);
      }
    }
  };

  lineOf[func.id] = emitLine(0, dialect.signature(func));
  block(func.body, 1);
  emitLine(0, '}');
  return { code: lines.join('\n'), lineOf };
}
