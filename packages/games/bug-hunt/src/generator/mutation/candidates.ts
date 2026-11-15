import type { BugType } from '@nerdose/core';
import { replaceNode, type FuncNode } from '@nerdose/polyglot';

import type { BuiltTemplate, MutationSite } from '../types';

import { OPERATORS, type OperatorId } from './operators';
import { findNode } from './tree-utils';

export type MutationCandidate = {
  site: MutationSite;
  operator: OperatorId;
  from: string;
  to: string;
  mutant: FuncNode;
};

const isRejection = (e: unknown): boolean =>
  e instanceof Error &&
  (e.message.startsWith('replace_kind_mismatch') || e.message === 'invalid_modulo_divisor');

/** Candidates in a stable order: sites as declared, then the operators of the type, then variants. */
export function mutationsOf(built: BuiltTemplate, bugType: BugType): MutationCandidate[] {
  const out: MutationCandidate[] = [];
  for (const site of built.sites) {
    const node = findNode(built.func, site.node);
    if (node === undefined) throw new Error(`bug-hunt: site node ${site.node} not found`);
    for (const operator of site.operators) {
      if (OPERATORS[operator].bugType !== bugType) continue;
      for (const variant of OPERATORS[operator].variants(node, site)) {
        try {
          const mutant = replaceNode(built.func, site.node, variant.replace);
          out.push({ site, operator, from: variant.from, to: variant.to, mutant });
        } catch (e) {
          if (!isRejection(e)) throw e;
        }
      }
    }
  }
  return out;
}
