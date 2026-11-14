import { BIG_O_OPTIONS, type BigOOption } from '@nerdose/core';

import type { BigOPayload, BigOResult } from '../definition/schemas';
import { OPTION_LABEL } from '../shared/labels';

export type ResultMark = { option: BigOOption; label: string; correct: boolean; chosen: boolean };
export type PreviewMark = { option: BigOOption; label: string; correct: boolean; trap: boolean };

/** The 8 options always in the fixed order, never dependent on the answer. */
export const resultMarks = (r: BigOResult): ResultMark[] =>
  BIG_O_OPTIONS.map((option) => ({
    option,
    label: OPTION_LABEL[option],
    correct: option === r.answer,
    chosen: option === r.chosen_option,
  }));

export const previewMarks = (p: BigOPayload): PreviewMark[] =>
  BIG_O_OPTIONS.map((option) => ({
    option,
    label: OPTION_LABEL[option],
    correct: option === p.answer,
    trap: p.trap_option !== null && option === p.trap_option,
  }));
