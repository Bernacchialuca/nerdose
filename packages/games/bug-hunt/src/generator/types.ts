import type { Rng } from '@nerdose/core';
import type { FuncNode, NodeId, TreeBuilder } from '@nerdose/polyglot';

import type { OperatorId } from './mutation/operators';

export type TemplateId =
  | 'all_where'
  | 'any_where'
  | 'binary_search'
  | 'count_equal_neighbors'
  | 'count_where'
  | 'extreme_index'
  | 'first_index_where'
  | 'is_palindrome'
  | 'is_sorted'
  | 'last_index_where'
  | 'max_window_sum'
  | 'sum_range';

export type TemplateParams = Readonly<Record<string, string | number | boolean>>;
export type TestArg = number | readonly number[];
export type TestInput = readonly TestArg[];
export type Localized = { es: string; en: string };

export type MutationSite = {
  node: NodeId;
  operators: readonly OperatorId[];
  role: Localized;
  swaps?: readonly string[];
  returns?: readonly string[];
};

export type BuiltTemplate = { func: FuncNode; sites: readonly MutationSite[] };

export type Template = {
  id: string;
  combos: readonly TemplateParams[];
  functionName(p: TemplateParams): string;
  build(p: TemplateParams, b: TreeBuilder): BuiltTemplate;
  spec(p: TemplateParams): Localized;
  edgeCases(p: TemplateParams): readonly TestInput[];
  randomInput(rng: Rng, p: TemplateParams): TestInput;
  reference(p: TemplateParams, input: TestInput): number | boolean;
};
