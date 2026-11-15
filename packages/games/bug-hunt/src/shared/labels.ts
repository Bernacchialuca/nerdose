import type { BugType, CodeLanguage, Locale } from '@nerdose/core';

export const LANGUAGE_LABEL: Record<CodeLanguage, string> = {
  js: 'JavaScript',
  go: 'Go',
  java: 'Java',
};

export const BUG_TYPE_LABEL: Record<BugType, Record<Locale, string>> = {
  off_by_one: { es: 'uno de más o de menos', en: 'off by one' },
  comparison: { es: 'comparación', en: 'comparison' },
  wrong_operator: { es: 'operador equivocado', en: 'wrong operator' },
  wrong_variable: { es: 'variable equivocada', en: 'wrong variable' },
  bad_initialization: { es: 'valor inicial', en: 'bad initialization' },
  misplaced_return: { es: 'return antes de tiempo', en: 'early return' },
  inverted_condition: { es: 'condición invertida', en: 'inverted condition' },
};
