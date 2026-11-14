import { createTreeBuilder, emit, type Expr, type NodeId, type Stmt } from '@nerdose/polyglot';

import { costFn } from './cost';
import { bindParams } from './params';
import type {
  BuiltRecipe,
  CompositionPart,
  LoopKind,
  LoopPart,
  Params,
  Recipe,
  Shape,
} from './types';

const LOOP_NAMES = ['i', 'j', 'k'] as const;

type Scope = { visible: Set<string>; outer: string | null };
type Inner = ((scope: Scope) => Stmt[]) | null;
type RawLoop = Omit<LoopPart, 'line'> & { id: NodeId | null };

/** Cost term of a shape as the explanation writes it (`n`, `log n`, `n × log n`). */
export function termOf(shape: Shape): string {
  switch (shape.kind) {
    case 'constant':
      return String(shape.k ?? 0);
    case 'linear':
      return shape.step === 2 ? 'n/2' : 'n';
    case 'dependent':
      return 'i';
    case 'doubling':
    case 'halving':
      return shape.bound === 'outer' ? 'log i' : 'log n';
    case 'binary_search':
      return 'log n';
    case 'nest':
      return `${termOf(shape.outer)} × ${termOf(shape.inner)}`;
    case 'seq':
      return shape.parts.map(termOf).join(' + ');
    default:
      throw new Error(`big-o: no_term ${shape.kind}`);
  }
}

const WORK_SHAPES = {
  linear: { kind: 'linear', step: 1 },
  quadratic: {
    kind: 'nest',
    outer: { kind: 'linear', step: 1 },
    inner: { kind: 'linear', step: 1 },
  },
  cubic: {
    kind: 'nest',
    outer: { kind: 'linear', step: 1 },
    inner: {
      kind: 'nest',
      outer: { kind: 'linear', step: 1 },
      inner: { kind: 'linear', step: 1 },
    },
  },
} as const satisfies Record<string, Shape>;

/**
 * Builds the function `f(n)` of a recipe with one tree builder (mixing nodes of two builders makes
 * `emit` throw) and emits it in the three languages. Names follow what Java (no shadowing), Go (no
 * unused variables) and JS/Java (no redeclaration in one block) accept: see `shape.test.ts`.
 */
export function buildRecipe(recipe: Recipe, params: Params): BuiltRecipe {
  const shape = bindParams(recipe.shape, params);
  const b = createTreeBuilder();
  const loops: RawLoop[] = [];
  const calls: NodeId[] = [];
  const compositions: CompositionPart[] = [];

  const n = () => b.var('n');
  const ops = () => b.var('ops');
  const num = (value: number) => b.num(value);
  const rootScope = (): Scope => ({ visible: new Set(['n', 'ops']), outer: null });
  const childScope = (scope: Scope, name: string): Scope => ({
    visible: new Set([...scope.visible, name]),
    outer: name,
  });
  const fresh = (scope: Scope): string => {
    const name = LOOP_NAMES.find((x) => !scope.visible.has(x));
    if (name === undefined) throw new Error(`big-o: no_free_name ${recipe.id}`);
    return name;
  };
  const outerVar = (scope: Scope) => {
    if (scope.outer === null) throw new Error(`big-o: missing_outer_variable ${recipe.id}`);
    return b.var(scope.outer);
  };
  const bound = (s: { bound?: 'n' | 'outer' }, scope: Scope) =>
    s.bound === 'outer' ? outerVar(scope) : n();

  const declare = (scope: Scope, name: string, value: () => Expr): Stmt => {
    if (scope.visible.has(name)) return b.assign(name, value());
    scope.visible.add(name);
    return b.let(name, value());
  };

  const loop = (shape: Shape, scope: Scope, inner: Inner): Stmt[] => {
    const kind = shape.kind as LoopKind;
    const raw: RawLoop = {
      kind,
      k: shape.kind === 'constant' ? (shape.k ?? 0) : null,
      step: shape.kind === 'linear' ? (shape.step ?? 1) : null,
      bound: 'bound' in shape && shape.bound === 'outer' ? 'outer' : 'n',
      term: termOf(shape),
      id: null,
    };
    loops.push(raw);
    const body = (s: Scope): Stmt[] => (inner ? inner(s) : [b.inc('ops')]);
    switch (shape.kind) {
      case 'constant':
      case 'linear':
      case 'dependent':
      case 'doubling': {
        const x = fresh(scope);
        const child = childScope(scope, x);
        const start = shape.kind === 'doubling' ? 1 : 0;
        const limit =
          shape.kind === 'constant'
            ? num(shape.k ?? 0)
            : shape.kind === 'linear'
              ? n()
              : shape.kind === 'dependent'
                ? outerVar(scope)
                : bound(shape, scope);
        const step =
          shape.kind === 'doubling'
            ? b.compound(x, '*=', num(2))
            : shape.kind === 'linear' && shape.step === 2
              ? b.compound(x, '+=', num(2))
              : b.inc(x);
        const stmt = b.for(b.let(x, num(start)), b.bin('<', b.var(x), limit), step, body(child));
        raw.id = stmt.id;
        return [stmt];
      }
      case 'halving': {
        const x = fresh(scope);
        const start = b.let(x, bound(shape, scope));
        scope.visible.add(x);
        const child = childScope(scope, x);
        const stmt = b.while(b.bin('>', b.var(x), num(0)), [
          ...body(child),
          b.assign(x, b.half(b.var(x))),
        ]);
        raw.id = stmt.id;
        return [start, stmt];
      }
      case 'binary_search': {
        const lo = declare(scope, 'lo', () => num(0));
        const hi = declare(scope, 'hi', () => n());
        const child: Scope = {
          visible: new Set([...scope.visible, 'lo', 'hi', 'mid']),
          outer: null,
        };
        const update =
          shape.branch === 'right'
            ? b.assign('lo', b.bin('+', b.var('mid'), num(1)))
            : b.assign('hi', b.var('mid'));
        const stmt = b.while(b.bin('<', b.var('lo'), b.var('hi')), [
          b.let('mid', b.half(b.bin('+', b.var('lo'), b.var('hi')))),
          ...body(child),
          update,
        ]);
        raw.id = stmt.id;
        return [lo, hi, stmt];
      }
      default:
        throw new Error(`big-o: not_a_loop ${shape.kind}`);
    }
  };

  const iterative = (s: Shape, scope: Scope, inner: Inner): Stmt[] => {
    if (s.kind === 'nest') {
      const stmts = iterative(s.outer, scope, (child) => iterative(s.inner, child, inner));
      compositions.push({ kind: 'nest', terms: [termOf(s.outer), termOf(s.inner)] });
      return stmts;
    }
    if (s.kind === 'seq') {
      const stmts = s.parts.flatMap((part) => iterative(part, scope, null));
      compositions.push({ kind: 'seq', terms: s.parts.map(termOf) });
      return stmts;
    }
    return loop(s, scope, inner);
  };

  const baseCase = (op: '<' | '<=', limit: number): Stmt =>
    b.if(b.bin(op, n(), num(limit)), [b.return(num(1))]);
  const recurseOnHalf = () => b.call('f', [b.half(n())]);
  const recurseOn = (minus: number) => b.call('f', [b.bin('-', n(), num(minus))]);

  const body = (): Stmt[] => {
    switch (shape.kind) {
      case 'divide_and_conquer': {
        if (shape.calls === 1 && shape.work === 'unit') {
          const ret = b.return(b.bin('+', recurseOnHalf(), num(1)));
          calls.push(ret.id);
          return [baseCase('<=', 1), ret];
        }
        const work: Shape | null =
          shape.work === 'unit'
            ? null
            : shape.work === 'constant'
              ? { kind: 'constant', k: shape.k ?? 0 }
              : WORK_SHAPES[shape.work];
        const workStmts = work === null ? [] : iterative(work, rootScope(), null);
        const recursion = Array.from({ length: shape.calls }, () =>
          b.compound('ops', '+=', recurseOnHalf()),
        );
        const first = recursion[0];
        if (first) calls.push(first.id);
        return [
          baseCase('<=', 1),
          b.let('ops', num(shape.work === 'unit' ? 1 : 0)),
          ...workStmts,
          ...recursion,
          b.return(ops()),
        ];
      }
      case 'double_recursion': {
        const secondMinus = shape.variant === 'n-1,n-2' ? 2 : 1;
        const calling = b.bin('+', recurseOn(1), recurseOn(secondMinus));
        const base = baseCase(
          shape.variant === 'n-1,n-2' ? '<' : '<=',
          shape.variant === 'n-1,n-2' ? 2 : 1,
        );
        if (shape.work === 'none') {
          const ret = b.return(calling);
          calls.push(ret.id);
          return [base, ret];
        }
        const workStmts = iterative({ kind: 'constant', k: shape.k ?? 0 }, rootScope(), null);
        const ret = b.return(b.bin('+', b.bin('+', ops(), recurseOn(1)), recurseOn(secondMinus)));
        calls.push(ret.id);
        return [base, b.let('ops', num(0)), ...workStmts, ret];
      }
      case 'permutations': {
        const loopStmts = loop({ kind: 'linear', step: 1 }, rootScope(), (scope) => {
          const call = b.compound('ops', '+=', recurseOn(1));
          calls.push(call.id);
          if (shape.work === 'inc') return [b.inc('ops'), call];
          if (shape.work === 'constant') {
            return [...iterative({ kind: 'constant', k: shape.k ?? 0 }, scope, null), call];
          }
          return [call];
        });
        return [baseCase('<=', 1), b.let('ops', num(0)), ...loopStmts, b.return(ops())];
      }
      default:
        return [b.let('ops', num(0)), ...iterative(shape, rootScope(), null), b.return(ops())];
    }
  };

  const func = b.func('f', ['n'], body());
  const js = emit(func, 'js');
  const lineOf = js.lineOf;
  const line = (id: NodeId): number => {
    const value = lineOf[id];
    if (value === undefined) throw new Error(`big-o: missing_line ${id}`);
    return value;
  };

  return {
    func,
    code: { js: js.code, go: emit(func, 'go').code, java: emit(func, 'java').code },
    lineOf,
    cost: costFn(shape),
    parts: {
      loops: loops.map(({ id, ...rest }) => {
        if (id === null) throw new Error(`big-o: loop_without_node ${recipe.id}`);
        return { ...rest, line: line(id) };
      }),
      calls: calls.map(line),
      compositions,
    },
  };
}
