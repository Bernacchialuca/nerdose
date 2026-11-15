import type { CodeLanguage } from '@nerdose/core';

import type { BugHuntPayload, BugHuntResult } from '../definition/schemas';

import { codeLines } from './lines';

export type LineMark = 'found' | 'bug' | 'wrong';

/** Won: the bug line is confirmed; lost: the bug line and the wrong pick. Same lines in all 3 languages. */
export function resultLineMarks(r: BugHuntResult): Map<number, LineMark> {
  if (r.win) return new Map([[r.bug_line, 'found']]);
  return new Map<number, LineMark>([
    [r.bug_line, 'bug'],
    [r.chosen_line, 'wrong'],
  ]);
}

export const previewLineMarks = (p: BugHuntPayload): Map<number, LineMark> =>
  new Map([[p.bug_line, 'bug']]);

/** `{ before, after }` of the fix for the admin preview, built like `definition.result` does. */
export function payloadFix(
  p: BugHuntPayload,
  language: CodeLanguage,
): { before: string; after: string } {
  return { before: codeLines(p.code[language])[p.bug_line - 1] ?? '', after: p.fix[language] };
}
