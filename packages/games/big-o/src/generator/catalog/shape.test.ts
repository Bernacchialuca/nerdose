import type { CodeLanguage } from '@nerdose/core';
import { emit, LANGUAGES, type Expr, type FuncNode, type Stmt } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { MAX_LINES, MAX_NESTING, MAX_RECURSION_DEPTH, measureCode, treeNesting } from '../shape';
import { SCALE } from '../scale';

import { buildRecipe } from './build';
import { paramCombos } from './params';
import { RECIPES } from './recipes';

const ALL = RECIPES.flatMap((recipe) =>
  paramCombos(recipe).map((params) => ({
    recipe,
    params,
    built: buildRecipe(recipe, params),
  })),
);
const LANGS: readonly CodeLanguage[] = LANGUAGES;

describe('catalog shape', () => {
  it('fits 15 lines and 3 levels with the same lines in the 3 languages (TS-12)', () => {
    for (const { recipe, built } of ALL) {
      const lines = LANGS.map((l) => measureCode(built.code[l], l));
      for (const m of lines) {
        expect(m.lines, recipe.id).toBeLessThanOrEqual(MAX_LINES);
        expect(m.nesting, recipe.id).toBeLessThanOrEqual(MAX_NESTING);
        expect(m.nesting, recipe.id).toBe(treeNesting(built.func));
      }
      expect(new Set(lines.map((m) => m.lines)).size, recipe.id).toBe(1);
      const js = emit(built.func, 'js').lineOf;
      expect(emit(built.func, 'go').lineOf, recipe.id).toEqual(js);
      expect(emit(built.func, 'java').lineOf, recipe.id).toEqual(js);
    }
  });

  it('compiles statically in Java, Go and JS (TS-13)', () => {
    const exprReads = (e: Expr, read: Set<string>, scopes: Set<string>[]): void => {
      switch (e.kind) {
        case 'var':
          expect(scopes.some((s) => s.has(e.name)) || e.name === 'n', `unbound ${e.name}`).toBe(true);
          read.add(e.name);
          break;
        case 'bin':
          exprReads(e.left, read, scopes);
          exprReads(e.right, read, scopes);
          break;
        case 'half':
          exprReads(e.expr, read, scopes);
          break;
        case 'call':
          e.args.forEach((a) => exprReads(a, read, scopes));
          break;
        default:
      }
    };
    const check = (func: FuncNode, id: string): void => {
      const visible = (scopes: Set<string>[], name: string) =>
        name === 'n' || scopes.some((s) => s.has(name));
      const block = (body: readonly Stmt[], scopes: Set<string>[], pending: Map<string, boolean>[]) => {
        const here = new Set<string>();
        const mine = new Map<string, boolean>();
        const inner = [...scopes, here];
        const innerPending = [...pending, mine];
        const read = (e: Expr) => {
          const names = new Set<string>();
          exprReads(e, names, inner);
          for (const name of names) {
            for (const p of innerPending) if (p.has(name)) p.set(name, true);
          }
        };
        const declare = (name: string, target: Set<string>, into: Map<string, boolean>) => {
          expect(visible(inner, name), `${id}: redeclares ${name}`).toBe(false);
          target.add(name);
          into.set(name, false);
        };
        body.forEach((s, index) => {
          if (index > 0) expect(body[index - 1]?.kind, `${id}: after return`).not.toBe('return');
          switch (s.kind) {
            case 'let':
              read(s.expr);
              declare(s.name, here, mine);
              break;
            case 'assign':
              read(s.expr);
              expect(visible(inner, s.name), `${id}: assign ${s.name}`).toBe(true);
              break;
            case 'inc':
              expect(visible(inner, s.name)).toBe(true);
              break;
            case 'compound':
              read(s.expr);
              break;
            case 'for': {
              const forScope = new Set<string>();
              const forPending = new Map<string, boolean>();
              expect(visible(inner, s.init.name), `${id}: for shadows ${s.init.name}`).toBe(false);
              read(s.init.expr);
              forScope.add(s.init.name);
              forPending.set(s.init.name, false);
              const withFor = [...inner, forScope];
              const readFor = (e: Expr) => {
                const names = new Set<string>();
                exprReads(e, names, withFor);
                for (const name of names) {
                  for (const p of [...innerPending, forPending]) if (p.has(name)) p.set(name, true);
                }
              };
              readFor(s.cond);
              block(s.body, withFor, [...innerPending, forPending]);
              for (const [name, wasRead] of forPending) expect(wasRead, `${id}: ${name} unread`).toBe(true);
              break;
            }
            case 'while':
              read(s.cond);
              block(s.body, inner, innerPending);
              break;
            case 'if':
              read(s.cond);
              block(s.then, inner, innerPending);
              break;
            case 'return':
              read(s.expr);
              break;
          }
        });
        for (const [name, wasRead] of mine) {
          expect(wasRead, `${id}: ${name} never read`).toBe(true);
        }
      };
      block(func.body, [], []);
      expect(func.body.at(-1)?.kind, `${id}: last statement`).toBe('return');
    };
    for (const { recipe, params, built } of ALL) check(built.func, `${recipe.id} ${params.join(',')}`);
  });

  it('uses neutral identifiers and no comments (TS-14)', () => {
    const allowed = new Set(['f', 'n', 'i', 'j', 'k', 'ops', 'lo', 'hi', 'mid']);
    const names = (body: readonly Stmt[], out: Set<string>): void => {
      const expr = (e: Expr): void => {
        if (e.kind === 'var') out.add(e.name);
        else if (e.kind === 'call') {
          out.add(e.name);
          e.args.forEach(expr);
        } else if (e.kind === 'bin') {
          expr(e.left);
          expr(e.right);
        } else if (e.kind === 'half') expr(e.expr);
      };
      for (const s of body) {
        if (s.kind === 'for') {
          out.add(s.init.name);
          expr(s.init.expr);
          expr(s.cond);
          names([s.step], out);
          names(s.body, out);
        } else if (s.kind === 'while') {
          expr(s.cond);
          names(s.body, out);
        } else if (s.kind === 'if') {
          expr(s.cond);
          names(s.then, out);
        } else {
          if ('name' in s) out.add(s.name);
          if ('expr' in s) expr(s.expr);
        }
      }
    };
    for (const { recipe, built } of ALL) {
      const found = new Set<string>();
      names(built.func.body, found);
      for (const name of found) expect(allowed.has(name), `${recipe.id}: ${name}`).toBe(true);
      expect(built.func.name).toBe('f');
      expect(built.func.params).toEqual(['n']);
      for (const l of LANGS) {
        const code = built.code[l];
        expect(code).not.toMatch(/\/\/|\/\*/);
        expect(code.includes(recipe.id), recipe.id).toBe(false);
        expect(code).not.toMatch(/log|half|binary|fact|square|cubic/);
      }
    }
  });

  it('keeps the recursion depth within 20 (TS-15)', () => {
    const calls = (body: readonly Stmt[], out: Expr[]): void => {
      const expr = (e: Expr): void => {
        if (e.kind === 'call') {
          out.push(e);
          e.args.forEach(expr);
        } else if (e.kind === 'bin') {
          expr(e.left);
          expr(e.right);
        } else if (e.kind === 'half') expr(e.expr);
      };
      for (const s of body) {
        if (s.kind === 'for') {
          expr(s.cond);
          calls(s.body, out);
        } else if (s.kind === 'while') {
          expr(s.cond);
          calls(s.body, out);
        } else if (s.kind === 'if') {
          expr(s.cond);
          calls(s.then, out);
        } else if ('expr' in s) expr(s.expr);
      }
    };
    for (const { recipe, built } of ALL) {
      const found: Expr[] = [];
      calls(built.func.body, found);
      for (const call of found) {
        expect(call.kind === 'call' && call.name).toBe('f');
        const arg = call.kind === 'call' ? (call.args[0] as Expr) : null;
        expect(arg).not.toBeNull();
        if (arg?.kind === 'half') {
          expect(arg.expr).toMatchObject({ kind: 'var', name: 'n' });
        } else {
          expect(['o_2n', 'o_n_fact'], recipe.id).toContain(recipe.answer);
          expect(arg).toMatchObject({ kind: 'bin', op: '-', left: { kind: 'var', name: 'n' } });
          const right = arg?.kind === 'bin' ? right_value(arg.right) : 0;
          expect([1, 2]).toContain(right);
        }
      }
      if (found.length > 0) {
        const max = Math.max(...SCALE[recipe.answer]);
        const depth = found.some((c) => c.kind === 'call' && c.args[0]?.kind === 'half')
          ? Math.floor(Math.log2(max)) + 1
          : max;
        expect(depth, recipe.id).toBeLessThanOrEqual(MAX_RECURSION_DEPTH);
      }
    }
  });
});

function right_value(e: Expr): number {
  return e.kind === 'num' ? e.value : -1;
}
