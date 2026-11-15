import type { GameGenerator } from '@nerdose/core';

import type { BugHuntPayload } from '../definition';

import { generate, historySpec, usedBankItems } from './generate';
import { verify } from './verify';

export const generator: GameGenerator<BugHuntPayload> = {
  historySpec,
  usedBankItems,
  generate,
  verify,
};

export { TEMPLATES, templateById } from './catalog';
export { addDays } from './days';
export { evaluateCandidate, type CandidateVerdict } from './evaluate-candidate';
export { formatCall, formatValue } from './format';
export { buildSources, correctCode, parseValues, testSignature, type Sources } from './harness';
export { createGenerate, generate, historySpec, MAX_COMBOS, usedBankItems } from './generate';
export { mutationsOf, type MutationCandidate } from './mutation/candidates';
export { neutralExpr, neutralStmt } from './mutation/neutral';
export { OPERATOR_IDS, OPERATORS, type OperatorId } from './mutation/operators';
export { MAX_LINES, MAX_NESTING, MIN_LINES, measureCode } from './shape';
export {
  buildTests,
  EVAL_STEP_LIMIT,
  MAX_TEST_DRAWS,
  selectTests,
  TEST_COUNT,
  testSize,
} from './tests';
export type {
  BuiltTemplate,
  MutationSite,
  Template,
  TemplateId,
  TemplateParams,
  TestInput,
} from './types';
export { canonicalJson, keysUsedNear, varietyKey, VARIETY_DAYS } from './variety';
export { createVerify, VERIFY_CHECKS, verify, type Runner } from './verify';
