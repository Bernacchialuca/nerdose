import { describeArg, isInt32 } from './int32';
import type { Expr, FuncNode, Stmt } from './nodes';
import { signatureOf } from './signature';

export const EVAL_MAX_STEPS = 100_000;
const MAX_CALL_DEPTH = 1_000;

export type EvalError = 'int_overflow' | 'index_out_of_range' | 'step_limit';
export type EvalOutcome =
  | { readonly ok: true; readonly value: number | boolean }
  | { readonly ok: false; readonly error: EvalError };
export type EvalOptions = { readonly maxSteps?: number };

type Value = number | boolean | readonly number[];
type Scope = { readonly vars: Map<string, Value>; readonly parent: Scope | undefined };

/** Internal signal for a `return` statement. */
class ReturnSignal {
  constructor(readonly value: Value) {}
}

/** Internal signal for a semantic error that `evaluate` reports as a value. */
class EvalFailure {
  constructor(readonly error: EvalError) {}
}

const malformed = (detail: string): Error => new Error(`evaluate: ${detail}`);

function checked(value: number): number {
  if (!isInt32(value)) throw new EvalFailure('int_overflow');
  return value;
}

function lookup(scope: Scope, name: string): Scope {
  for (let s: Scope | undefined = scope; s; s = s.parent) {
    if (s.vars.has(name)) return s;
  }
  throw malformed(`unbound ${name}`);
}

function asInt(value: Value | undefined, what: string): number {
  if (typeof value !== 'number') throw malformed(`${what} is not an int`);
  return value;
}

function asBool(value: Value | undefined, what: string): boolean {
  if (typeof value !== 'boolean') throw malformed(`${what} is not a bool`);
  return value;
}

function asArray(value: Value | undefined, what: string): readonly number[] {
  if (!Array.isArray(value)) throw malformed(`${what} is not an array`);
  return value as readonly number[];
}

/**
 * Reference interpreter of the tree: the semantics of the portable subset. Every integer result
 * must fit in 32 bits (otherwise `int_overflow`), `half` and `%` truncate toward zero and `&&` /
 * `||` short-circuit. It never runs the tree through `eval`, a process or a clock.
 */
export function evaluate(
  func: FuncNode,
  args: readonly (number | readonly number[] | boolean)[],
  options: EvalOptions = {},
): EvalOutcome {
  const maxSteps = options.maxSteps ?? EVAL_MAX_STEPS;
  const signature = signatureOf(func);
  if (args.length !== signature.params.length) {
    throw new RangeError(`arity_mismatch: expected ${signature.params.length}, got ${args.length}`);
  }
  args.forEach((arg, i) => {
    const type = signature.params[i];
    const valid =
      type === 'bool'
        ? typeof arg === 'boolean'
        : type === 'int[]'
          ? Array.isArray(arg) && arg.every(isInt32)
          : isInt32(arg);
    if (!valid) throw new RangeError(`invalid_argument: ${describeArg(arg)}`);
  });

  let steps = 0;
  let depth = 0;
  const tick = (): void => {
    steps += 1;
    if (steps > maxSteps) throw new EvalFailure('step_limit');
  };

  const expr = (e: Expr, scope: Scope): Value => {
    switch (e.kind) {
      case 'num':
        return e.value;
      case 'bool':
        return e.value;
      case 'var': {
        return lookup(scope, e.name).vars.get(e.name) as Value;
      }
      case 'half':
        return checked(Math.trunc(asInt(expr(e.expr, scope), 'half operand') / 2));
      case 'len':
        return asArray(expr(e.array, scope), 'len operand').length;
      case 'index': {
        const array = asArray(expr(e.array, scope), 'index operand');
        const at = asInt(expr(e.index, scope), 'index');
        if (at < 0 || at >= array.length) throw new EvalFailure('index_out_of_range');
        return array[at] as number;
      }
      case 'call': {
        if (e.name !== func.name) throw malformed(`unknown function ${e.name}`);
        tick();
        const values = e.args.map((a) => expr(a, scope));
        return call(values);
      }
      case 'bin': {
        if (e.op === '&&') {
          return (
            asBool(expr(e.left, scope), '&& operand') && asBool(expr(e.right, scope), '&& operand')
          );
        }
        if (e.op === '||') {
          return (
            asBool(expr(e.left, scope), '|| operand') || asBool(expr(e.right, scope), '|| operand')
          );
        }
        const left = expr(e.left, scope);
        const right = expr(e.right, scope);
        if (e.op === '==' || e.op === '!=') {
          if (typeof left !== typeof right || typeof left === 'object') {
            throw malformed(`incomparable operands of ${e.op}`);
          }
          return e.op === '==' ? left === right : left !== right;
        }
        const l = asInt(left, `${e.op} operand`);
        const r = asInt(right, `${e.op} operand`);
        switch (e.op) {
          case '+':
            return checked(l + r);
          case '-':
            return checked(l - r);
          case '*':
            return checked(l * r);
          case '%':
            if (r === 0) throw malformed('modulo by zero');
            return checked(l % r);
          case '<':
            return l < r;
          case '<=':
            return l <= r;
          case '>':
            return l > r;
          case '>=':
            return l >= r;
        }
      }
    }
  };

  const condition = (e: Expr, scope: Scope): boolean => asBool(expr(e, scope), 'condition');

  const block = (body: readonly Stmt[], parent: Scope): void => {
    const scope: Scope = { vars: new Map(), parent };
    for (const s of body) stmt(s, scope);
  };

  const stmt = (s: Stmt, scope: Scope): void => {
    tick();
    switch (s.kind) {
      case 'let':
        scope.vars.set(s.name, expr(s.expr, scope));
        return;
      case 'assign': {
        const value = expr(s.expr, scope);
        lookup(scope, s.name).vars.set(s.name, value);
        return;
      }
      case 'inc': {
        const owner = lookup(scope, s.name);
        owner.vars.set(s.name, checked(asInt(owner.vars.get(s.name), s.name) + 1));
        return;
      }
      case 'compound': {
        const owner = lookup(scope, s.name);
        const current = asInt(owner.vars.get(s.name), s.name);
        const operand = asInt(expr(s.expr, scope), `${s.op} operand`);
        const next =
          s.op === '+=' ? current + operand : s.op === '-=' ? current - operand : current * operand;
        owner.vars.set(s.name, checked(next));
        return;
      }
      case 'return':
        throw new ReturnSignal(expr(s.expr, scope));
      case 'if':
        if (condition(s.cond, scope)) block(s.then, scope);
        return;
      case 'while':
        for (;;) {
          tick();
          if (!condition(s.cond, scope)) return;
          block(s.body, scope);
        }
      case 'for': {
        const loop: Scope = { vars: new Map(), parent: scope };
        stmt(s.init, loop);
        for (;;) {
          tick();
          if (!condition(s.cond, loop)) return;
          block(s.body, loop);
          stmt(s.step, loop);
        }
      }
    }
  };

  const call = (values: readonly Value[]): Value => {
    if (values.length !== func.params.length) {
      throw malformed(`call to ${func.name} with ${values.length} arguments`);
    }
    depth += 1;
    if (depth > MAX_CALL_DEPTH) throw new EvalFailure('step_limit');
    const scope: Scope = { vars: new Map(), parent: undefined };
    func.params.forEach((name, i) => scope.vars.set(name, values[i] as Value));
    try {
      for (const s of func.body) stmt(s, scope);
    } catch (signal) {
      if (signal instanceof ReturnSignal) return signal.value;
      throw signal;
    } finally {
      depth -= 1;
    }
    throw malformed('missing return');
  };

  try {
    const value = call(args as readonly Value[]);
    if (typeof value === 'object') throw malformed('function returns an array');
    return { ok: true, value: value === 0 ? 0 : value };
  } catch (failure) {
    if (failure instanceof EvalFailure) return { ok: false, error: failure.error };
    // The interpreter's own stack ran out before MAX_CALL_DEPTH: the real languages overflow too.
    if (failure instanceof RangeError && /call stack/i.test(failure.message)) {
      return { ok: false, error: 'step_limit' };
    }
    throw failure;
  }
}
