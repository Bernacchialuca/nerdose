import type { BigOOption, CodeLanguage } from '@nerdose/core';

export const OPTION_LABEL: Record<BigOOption, string> = {
  o_1: 'O(1)',
  o_log_n: 'O(log n)',
  o_n: 'O(n)',
  o_n_log_n: 'O(n log n)',
  o_n2: 'O(n²)',
  o_n3: 'O(n³)',
  o_2n: 'O(2ⁿ)',
  o_n_fact: 'O(n!)',
};

export const LANGUAGE_LABEL: Record<CodeLanguage, string> = {
  js: 'JavaScript',
  go: 'Go',
  java: 'Java',
};
