import {
  BUG_TYPES,
  CODE_LANGUAGES,
  type BugType,
  type CodeLanguage,
  type Locale,
} from '@nerdose/core';

import type { BugHuntStats } from '../definition/schemas';

type Counter = { played: number; correct: number; rate: number | null };
export type LanguageRate = Counter & { language: CodeLanguage };
export type BugTypeRate = Counter & { bugType: BugType };

const counter = (entry: { played: number; correct: number } | undefined): Counter => {
  const { played = 0, correct = 0 } = entry ?? {};
  return { played, correct, rate: played === 0 ? null : correct / played };
};

export function languageRates(stats: BugHuntStats): LanguageRate[] {
  return CODE_LANGUAGES.map((language) => ({ language, ...counter(stats.by_language[language]) }));
}

export function bugTypeRates(stats: BugHuntStats): BugTypeRate[] {
  return BUG_TYPES.map((bugType) => ({ bugType, ...counter(stats.by_bug_type[bugType]) }));
}

export function gamesCount(stats: BugHuntStats): number {
  return languageRates(stats).reduce((sum, row) => sum + row.played, 0);
}

export function formatPercent(rate: number | null, locale: Locale): string {
  if (rate === null) return '—';
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(rate);
}
