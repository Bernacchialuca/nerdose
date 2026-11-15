import type { FuncNode, Stmt, Type } from '../tree/nodes';

/** A statement that fits on one line (no body). */
export type SimpleStmt = Exclude<Stmt, { kind: 'for' | 'while' | 'if' }>;

/**
 * Syntax of one language. A dialect only returns text: line breaks and nesting are decided by the
 * common printer, which is what guarantees that every language has the same line structure.
 */
export type Dialect = {
  readonly indent: string;
  readonly terminator: string;
  /** Operator emitted for the tree's `==`. */
  readonly equals: string;
  /** Operator emitted for the tree's `!=`. */
  readonly notEquals: string;
  signature(func: FuncNode): string;
  /** `let x = e` in the language, with no terminator. */
  declare(name: string, value: string, type: Type): string;
  /** Length of an already printed array operand. */
  len(operand: string): string;
  forHeader(init: string, cond: string, step: string): string;
  whileHeader(cond: string): string;
  ifHeader(cond: string): string;
  /** Integer division by 2 of an already printed operand. */
  half(operand: string): string;
  /** Whether `half` prints as an operator with the precedence of `*` (Go, Java), not atomically. */
  readonly halfIsOperator: boolean;
  /** Whether a `bin` or `half` operand of `half` needs parentheses (`bin` always does). */
  readonly halfWrapsHalf: boolean;
};
