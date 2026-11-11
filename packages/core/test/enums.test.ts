import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  CODE_LANGUAGES,
  DATE_PRECISIONS,
  LOCALES,
  REPORT_REASONS,
  REPORT_STATUSES,
  TERM_CATEGORIES,
  TIMELINE_CATEGORIES,
  isGameId,
} from '../src/index';
import type {
  CodeLanguage,
  DatePrecision,
  GameId,
  Locale,
  ReportReason,
  ReportStatus,
  TermCategory,
  TimelineCategory,
} from '../src/index';
import { GAME_IDS } from '../src/game-definition';

describe('shared enums', () => {
  it('lists LOCALES (TS-22)', () => {
    expect(LOCALES).toEqual(['es', 'en']);
  });

  it('lists CODE_LANGUAGES (TS-23)', () => {
    expect(CODE_LANGUAGES).toEqual(['js', 'go', 'java']);
  });

  it('isGameId accepts the five ids (TS-24)', () => {
    for (const id of ['devdle', 'bug-hunt', 'big-o', 'timeline', 'grep-grid']) {
      expect(isGameId(id)).toBe(true);
    }
    expect(GAME_IDS.every((id) => isGameId(id))).toBe(true);
  });

  it.each(['chess', 'Devdle', 'devdle ', '', 42, null, undefined, {}])(
    'isGameId rejects %j (TS-25)',
    (value) => {
      expect(isGameId(value)).toBe(false);
    },
  );

  it('derives types (TS-26)', () => {
    expectTypeOf<Locale>().toEqualTypeOf<'es' | 'en'>();
    expectTypeOf<CodeLanguage>().toEqualTypeOf<'js' | 'go' | 'java'>();
    const v: unknown = 'devdle';
    if (isGameId(v)) expectTypeOf(v).toEqualTypeOf<GameId>();
  });
});

describe('TERM_CATEGORIES', () => {
  it('lists the eight categories in fixed order (TS-16)', () => {
    expect(TERM_CATEGORIES).toEqual([
      'programming_languages',
      'git',
      'databases',
      'networking',
      'linux',
      'apis',
      'security',
      'software_engineering',
    ]);
    expect(TERM_CATEGORIES).toHaveLength(8);
  });

  it('derives TermCategory and is read-only (TS-17)', () => {
    expectTypeOf<TermCategory>().toEqualTypeOf<
      | 'programming_languages'
      | 'git'
      | 'databases'
      | 'networking'
      | 'linux'
      | 'apis'
      | 'security'
      | 'software_engineering'
    >();
    const mutate = (): void => {
      // @ts-expect-error TERM_CATEGORIES is readonly
      TERM_CATEGORIES.push('ai');
    };
    expectTypeOf(mutate).toBeFunction();
  });
});

describe('TIMELINE_CATEGORIES', () => {
  it('lists the eight categories in fixed order (TS-1)', () => {
    expect(TIMELINE_CATEGORIES).toEqual([
      'programming_languages',
      'frameworks',
      'companies',
      'operating_systems',
      'hardware',
      'video_games',
      'databases',
      'software_tools',
    ]);
    expect(TIMELINE_CATEGORIES).toHaveLength(8);
  });

  it('derives TimelineCategory (TS-2)', () => {
    expectTypeOf<TimelineCategory>().toEqualTypeOf<
      | 'programming_languages'
      | 'frameworks'
      | 'companies'
      | 'operating_systems'
      | 'hardware'
      | 'video_games'
      | 'databases'
      | 'software_tools'
    >();
  });

  it('is read-only (TS-3)', () => {
    const mutate = (): void => {
      // @ts-expect-error TIMELINE_CATEGORIES is readonly
      TIMELINE_CATEGORIES.push('ai');
    };
    expectTypeOf(mutate).toBeFunction();
  });

  it('shares only programming_languages and databases with TERM_CATEGORIES (TS-7)', () => {
    expect(TERM_CATEGORIES).toHaveLength(8);
    expect(
      TIMELINE_CATEGORIES.filter((c) => (TERM_CATEGORIES as readonly string[]).includes(c)),
    ).toEqual(['programming_languages', 'databases']);
  });
});

describe('DATE_PRECISIONS', () => {
  it('lists the three precisions in fixed order (TS-4)', () => {
    expect(DATE_PRECISIONS).toEqual(['year', 'month', 'day']);
    expect(DATE_PRECISIONS).toHaveLength(3);
  });

  it('derives DatePrecision (TS-5)', () => {
    expectTypeOf<DatePrecision>().toEqualTypeOf<'year' | 'month' | 'day'>();
  });

  it('is read-only (TS-6)', () => {
    const mutate = (): void => {
      // @ts-expect-error DATE_PRECISIONS is readonly
      DATE_PRECISIONS.push('week');
    };
    expectTypeOf(mutate).toBeFunction();
  });

  it('lists REPORT_REASONS and REPORT_STATUSES (S-030)', () => {
    expect(REPORT_REASONS).toEqual([
      'wrong_answer',
      'ambiguous',
      'wrong_explanation',
      'translation',
      'display_bug',
      'other',
    ]);
    expect(REPORT_STATUSES).toEqual(['open', 'resolved', 'dismissed']);
  });
});

describe('report enums types', () => {
  it('derives ReportReason and ReportStatus and is read-only (TS-40)', () => {
    expectTypeOf<ReportReason>().toEqualTypeOf<
      'wrong_answer' | 'ambiguous' | 'wrong_explanation' | 'translation' | 'display_bug' | 'other'
    >();
    expectTypeOf<ReportStatus>().toEqualTypeOf<'open' | 'resolved' | 'dismissed'>();
    const mutate = (): void => {
      // @ts-expect-error REPORT_REASONS is readonly
      REPORT_REASONS.push('spam');
    };
    expectTypeOf(mutate).toBeFunction();
  });
});
