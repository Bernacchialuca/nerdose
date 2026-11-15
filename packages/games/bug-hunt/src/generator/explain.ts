import type { BugHuntPayload, BugHuntTestCase } from '../definition';

import { formatCall, formatValue } from './format';
import type { OperatorId } from './mutation/operators';
import { fixText, STEP_ONE, stepThree, stepTwo } from './texts';
import type { Localized } from './types';

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export type ExplanationInput = {
  operator: OperatorId;
  role: Localized;
  from: string;
  to: string;
  functionName: string;
  failing: BugHuntTestCase;
};

/** Three fixed steps: the changed line, the trace on the hidden test, the visible tests and the fix. */
export function buildExplanation(input: ExplanationInput): BugHuntPayload['explanation'] {
  const { operator, role, from, to, functionName, failing } = input;
  const one = {
    es: STEP_ONE[operator]({ Role: capitalize(role.es), from, to }).es,
    en: STEP_ONE[operator]({ Role: capitalize(role.en), from, to }).en,
  };
  return {
    steps: [
      one,
      stepTwo({
        call: formatCall(functionName, failing.input),
        expected: formatValue(failing.expected),
        actual: formatValue(failing.actual),
      }),
      stepThree(fixText(operator, from)),
    ],
  };
}
