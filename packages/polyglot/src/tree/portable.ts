import type { Expr, FuncNode, NodeId, Stmt, Type } from './nodes';
import { signatureOf } from './signature';
import { walk } from './walk';

export type PortabilityIssueKind =
  | 'type_mismatch'
  | 'unused_local'
  | 'unreachable_statement'
  | 'missing_return';
export type PortabilityIssue = { readonly kind: PortabilityIssueKind; readonly nodeId: NodeId };

type Binding = { readonly type: Type; readonly declaredAt: NodeId | undefined; read: boolean };
type Scope = { readonly bindings: Map<string, Binding>; readonly parent: Scope | undefined };
/** `undefined` is an unknown type: it is never reported again by the parent expression. */
type Ty = Type | undefined;

const ARITHMETIC = new Set(['+', '-', '*', '%']);
const ORDERING = new Set(['<', '<=', '>', '>=']);
const LOGICAL = new Set(['&&', '||']);

function isConstant(e: Expr): boolean {
  let constant = true;
  walk(e, (n) => {
    if (n.kind === 'var' || n.kind === 'index' || n.kind === 'len' || n.kind === 'call') {
      constant = false;
    }
  });
  return constant;
}

/**
 * Static checks of what does not compile (or compiles differently) in at least one of the three
 * languages. Returns the issues in emission order, `[]` when the tree is portable. It never throws.
 * `unused_local` is conservative on purpose: only a read through a `var` counts as a use.
 */
export function checkPortable(func: FuncNode): PortabilityIssue[] {
  const signature = signatureOf(func);
  const issues: PortabilityIssue[] = [];
  const bindings: Binding[] = [];
  const report = (kind: PortabilityIssueKind, nodeId: NodeId): void => {
    issues.push({ kind, nodeId });
  };

  const lookup = (scope: Scope, name: string): Binding | undefined => {
    for (let s: Scope | undefined = scope; s; s = s.parent) {
      const found = s.bindings.get(name);
      if (found) return found;
    }
    return undefined;
  };

  const declare = (scope: Scope, name: string, type: Type, declaredAt?: NodeId): void => {
    const binding: Binding = { type, declaredAt, read: false };
    scope.bindings.set(name, binding);
    if (declaredAt !== undefined) bindings.push(binding);
  };

  const infer = (e: Expr, scope: Scope): Ty => {
    switch (e.kind) {
      case 'num':
        return 'int';
      case 'bool':
        return 'bool';
      case 'var': {
        const binding = lookup(scope, e.name);
        if (!binding) {
          report('type_mismatch', e.id);
          return undefined;
        }
        binding.read = true;
        return binding.type;
      }
      case 'half':
        expect(e.expr, 'int', scope);
        return 'int';
      case 'len':
        expect(e.array, 'int[]', scope);
        return 'int';
      case 'index':
        expect(e.array, 'int[]', scope);
        expect(e.index, 'int', scope);
        return 'int';
      case 'call': {
        const types = e.args.map((a) => infer(a, scope));
        if (e.name !== func.name || e.args.length !== signature.params.length) {
          report('type_mismatch', e.id);
          return e.name === func.name ? signature.returns : undefined;
        }
        types.forEach((t, i) => {
          const wanted = signature.params[i];
          const arg = e.args[i];
          if (t !== undefined && t !== wanted && arg) report('type_mismatch', arg.id);
        });
        return signature.returns;
      }
      case 'bin': {
        if (ARITHMETIC.has(e.op)) {
          expect(e.left, 'int', scope);
          expect(e.right, 'int', scope);
          return 'int';
        }
        if (ORDERING.has(e.op)) {
          expect(e.left, 'int', scope);
          expect(e.right, 'int', scope);
          return 'bool';
        }
        if (LOGICAL.has(e.op)) {
          expect(e.left, 'bool', scope);
          expect(e.right, 'bool', scope);
          return 'bool';
        }
        const left = infer(e.left, scope);
        const right = infer(e.right, scope);
        const comparable =
          left === undefined ||
          right === undefined ||
          (left === right && left !== 'int[]' && right !== 'int[]');
        if (!comparable) report('type_mismatch', e.id);
        return 'bool';
      }
    }
  };

  function expect(e: Expr, wanted: Type, scope: Scope): void {
    const actual = infer(e, scope);
    if (actual !== undefined && actual !== wanted) report('type_mismatch', e.id);
  }

  const block = (body: readonly Stmt[], parent: Scope): void => {
    const scope: Scope = { bindings: new Map(), parent };
    let returned = false;
    let reported = false;
    for (const s of body) {
      if (returned && !reported) {
        report('unreachable_statement', s.id);
        reported = true;
      }
      stmt(s, scope);
      if (s.kind === 'return') returned = true;
    }
  };

  const reportConstantLoop = (cond: Expr, id: NodeId): void => {
    if (isConstant(cond)) report('unreachable_statement', id);
  };

  const stmt = (s: Stmt, scope: Scope): void => {
    switch (s.kind) {
      case 'let': {
        const type: Type = s.type ?? 'int';
        expect(s.expr, type, scope);
        declare(scope, s.name, type, s.id);
        return;
      }
      case 'assign': {
        const binding = lookup(scope, s.name);
        if (!binding) report('type_mismatch', s.id);
        expect(s.expr, binding?.type ?? 'int', scope);
        return;
      }
      case 'inc': {
        const binding = lookup(scope, s.name);
        if (!binding || binding.type !== 'int') report('type_mismatch', s.id);
        return;
      }
      case 'compound': {
        const binding = lookup(scope, s.name);
        if (!binding || binding.type !== 'int') report('type_mismatch', s.id);
        expect(s.expr, 'int', scope);
        return;
      }
      case 'return':
        expect(s.expr, signature.returns, scope);
        return;
      case 'if':
        expect(s.cond, 'bool', scope);
        block(s.then, scope);
        return;
      case 'while':
        expect(s.cond, 'bool', scope);
        reportConstantLoop(s.cond, s.id);
        block(s.body, scope);
        return;
      case 'for': {
        const loop: Scope = { bindings: new Map(), parent: scope };
        stmt(s.init, loop);
        expect(s.cond, 'bool', loop);
        reportConstantLoop(s.cond, s.id);
        stmt(s.step, loop);
        block(s.body, loop);
        return;
      }
    }
  };

  const root: Scope = { bindings: new Map(), parent: undefined };
  func.params.forEach((name, i) => declare(root, name, signature.params[i] ?? 'int'));
  block(func.body, root);
  if (func.body[func.body.length - 1]?.kind !== 'return') report('missing_return', func.id);
  for (const b of bindings) {
    if (!b.read && b.declaredAt !== undefined) report('unused_local', b.declaredAt);
  }

  const order = new Map<NodeId, number>();
  walk(func, (n) => {
    if (!order.has(n.id)) order.set(n.id, order.size);
  });
  const position = (id: NodeId): number => order.get(id) ?? Number.MAX_SAFE_INTEGER;
  return issues
    .map((issue, index) => ({ issue, index }))
    .sort((a, b) => position(a.issue.nodeId) - position(b.issue.nodeId) || a.index - b.index)
    .map(({ issue }) => issue);
}
