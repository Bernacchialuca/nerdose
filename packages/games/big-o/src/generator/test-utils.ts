import type { Expr, FuncNode, Stmt } from '@nerdose/polyglot';

const MAX_INT = 2 ** 31 - 1;
const STEP_LIMIT = 50_000_000;

class Return {
  constructor(readonly value: number) {}
}

/**
 * Evaluates a `FuncNode` with the integer semantics of the portable subset. Test-only: it walks
 * the tree and never runs emitted code (that is the runner's job, in S-045).
 */
export function interpret(func: FuncNode, n: number): { value: number; maxDepth: number } {
  let steps = 0;
  let depth = 0;
  let maxDepth = 0;

  const check = (value: number): number => {
    if (!Number.isInteger(value) || value < 0 || value > MAX_INT) {
      throw new Error('interpret: overflow');
    }
    return value;
  };
  const tick = (): void => {
    if (++steps > STEP_LIMIT) throw new Error('interpret: step limit');
  };

  const call = (arg: number): number => {
    depth++;
    maxDepth = Math.max(maxDepth, depth);
    const env = new Map<string, number>([[func.params[0] ?? 'n', arg]]);
    try {
      runBlock(func.body, env);
    } catch (e) {
      if (e instanceof Return) return e.value;
      throw e;
    } finally {
      depth--;
    }
    throw new Error('interpret: function without return');
  };

  const evalExpr = (e: Expr, env: Map<string, number>): number => {
    tick();
    switch (e.kind) {
      case 'num':
        return e.value;
      case 'var': {
        const value = env.get(e.name);
        if (value === undefined) throw new Error(`interpret: unbound ${e.name}`);
        return value;
      }
      case 'half':
        return Math.trunc(evalExpr(e.expr, env) / 2);
      case 'call':
        if (e.name !== func.name) throw new Error(`interpret: unknown function ${e.name}`);
        return call(evalExpr(e.args[0] as Expr, env));
      case 'bin': {
        const l = evalExpr(e.left, env);
        const r = evalExpr(e.right, env);
        switch (e.op) {
          case '+':
            return check(l + r);
          case '-':
            return check(l - r);
          case '*':
            return check(l * r);
          case '<':
            return Number(l < r);
          case '<=':
            return Number(l <= r);
          case '>':
            return Number(l > r);
          case '>=':
            return Number(l >= r);
          case '==':
            return Number(l === r);
        }
      }
    }
  };

  const runBlock = (body: readonly Stmt[], env: Map<string, number>): void => {
    for (const s of body) runStmt(s, env);
  };

  const runStmt = (s: Stmt, env: Map<string, number>): void => {
    tick();
    switch (s.kind) {
      case 'let':
      case 'assign':
        env.set(s.name, check(evalExpr(s.expr, env)));
        return;
      case 'inc':
        env.set(s.name, check((env.get(s.name) ?? 0) + 1));
        return;
      case 'compound': {
        const current = env.get(s.name) ?? 0;
        const operand = evalExpr(s.expr, env);
        env.set(s.name, check(s.op === '+=' ? current + operand : current * operand));
        return;
      }
      case 'for': {
        const scope = new Map(env);
        runStmt(s.init, scope);
        while (evalExpr(s.cond, scope)) {
          runBlock(s.body, scope);
          runStmt(s.step, scope);
        }
        sync(env, scope);
        return;
      }
      case 'while':
        while (evalExpr(s.cond, env)) runBlock(s.body, env);
        return;
      case 'if':
        if (evalExpr(s.cond, env)) runBlock(s.then, env);
        return;
      case 'return':
        throw new Return(check(evalExpr(s.expr, env)));
    }
  };

  /** Writes back the variables of the enclosing scope that the inner scope changed. */
  const sync = (outer: Map<string, number>, inner: Map<string, number>): void => {
    for (const key of outer.keys()) outer.set(key, inner.get(key) as number);
  };

  return { value: call(n), maxDepth };
}
