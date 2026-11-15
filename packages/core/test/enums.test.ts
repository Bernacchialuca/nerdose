import { describe, expect, expectTypeOf, it } from 'vitest';

import { z } from 'zod';

import {
  BIG_O_OPTIONS,
  BUG_TYPES,
  CODE_LANGUAGES,
  DATE_PRECISIONS,
  GENERATION_REQUEST_STATUSES,
  LOCALES,
  RECIPE_CATEGORIES,
  REPORT_REASONS,
  REPORT_STATUSES,
  TERM_CATEGORIES,
  TIMELINE_CATEGORIES,
  isGameId,
} from '../src/index';
import type {
  BigOOption,
  BugType,
  CodeLanguage,
  DatePrecision,
  GameId,
  GenerationRequestStatus,
  Locale,
  RecipeCategory,
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

describe('GENERATION_REQUEST_STATUSES', () => {
  it('lists values in order (TS-12)', () => {
    expect(GENERATION_REQUEST_STATUSES).toEqual(['pending', 'done', 'failed', 'cancelled']);
    expect(GENERATION_REQUEST_STATUSES).toHaveLength(4);
  });

  it('derives GenerationRequestStatus and is read-only (TS-13)', () => {
    expectTypeOf<GenerationRequestStatus>().toEqualTypeOf<
      'pending' | 'done' | 'failed' | 'cancelled'
    >();
    const mutate = (): void => {
      // @ts-expect-error GENERATION_REQUEST_STATUSES is readonly
      GENERATION_REQUEST_STATUSES.push('running');
    };
    expectTypeOf(mutate).toBeFunction();
  });

  it('accepts cancelled and rejects invented values (TS-14)', () => {
    const s: GenerationRequestStatus = 'cancelled';
    // @ts-expect-error 'running' is not a GenerationRequestStatus
    const r: GenerationRequestStatus = 'running';
    expect(s).toBe('cancelled');
    expect(r).toBe('running');
  });
});

describe('Big O enums (S-042)', () => {
  it('lists BIG_O_OPTIONS in fixed order (S-042 TS-1)', () => {
    expect(BIG_O_OPTIONS).toEqual([
      'o_1',
      'o_log_n',
      'o_n',
      'o_n_log_n',
      'o_n2',
      'o_n3',
      'o_2n',
      'o_n_fact',
    ]);
    expect(BIG_O_OPTIONS).toHaveLength(8);
  });

  it('derives BigOOption (S-042 TS-2)', () => {
    expectTypeOf<BigOOption>().toEqualTypeOf<
      'o_1' | 'o_log_n' | 'o_n' | 'o_n_log_n' | 'o_n2' | 'o_n3' | 'o_2n' | 'o_n_fact'
    >();
  });

  it('keeps BIG_O_OPTIONS read-only (S-042 TS-3)', () => {
    const mutate = (): void => {
      // @ts-expect-error BIG_O_OPTIONS is readonly
      BIG_O_OPTIONS.push('o_n4');
    };
    expectTypeOf(mutate).toBeFunction();
  });

  it('rejects invented BigOOption values (S-042 TS-4)', () => {
    const ok: BigOOption = 'o_n_log_n';
    // @ts-expect-error 'o_n4' is not a BigOOption
    const bad: BigOOption = 'o_n4';
    expect(ok).toBe('o_n_log_n');
    expect(bad).toBe('o_n4');
  });

  it('lists RECIPE_CATEGORIES in fixed order (S-042 TS-5)', () => {
    expect(RECIPE_CATEGORIES).toEqual([
      'simple_loops',
      'nested_loops',
      'recursion',
      'divide_and_conquer',
      'binary_search',
    ]);
    expect(RECIPE_CATEGORIES).toHaveLength(5);
  });

  it('derives RecipeCategory and keeps the list read-only (S-042 TS-6)', () => {
    expectTypeOf<RecipeCategory>().toEqualTypeOf<
      'simple_loops' | 'nested_loops' | 'recursion' | 'divide_and_conquer' | 'binary_search'
    >();
    const mutate = (): void => {
      // @ts-expect-error RECIPE_CATEGORIES is readonly
      RECIPE_CATEGORIES.push('graphs');
    };
    expectTypeOf(mutate).toBeFunction();
  });

  it('works with z.enum for the Big O moveSchema (S-042 TS-7)', () => {
    const schema = z.strictObject({
      language: z.enum(CODE_LANGUAGES),
      option: z.enum(BIG_O_OPTIONS),
    });
    const good = schema.safeParse({ language: 'go', option: 'o_n_log_n' });
    expect(good.success).toBe(true);
    expect(good.data).toEqual({ language: 'go', option: 'o_n_log_n' });
    expect(schema.safeParse({ language: 'go', option: 'o_n4' }).success).toBe(false);
    expect(schema.safeParse({ language: 'rust', option: 'o_1' }).success).toBe(false);
    expect(schema.safeParse({ language: 'js', option: 'o_1', extra: 1 }).success).toBe(false);
  });
});

describe('Bug Hunt enums (S-048)', () => {
  it('lists BUG_TYPES in fixed order (S-048 TS-1)', () => {
    expect(BUG_TYPES).toEqual([
      'off_by_one',
      'comparison',
      'wrong_operator',
      'wrong_variable',
      'bad_initialization',
      'misplaced_return',
      'inverted_condition',
    ]);
    expect(BUG_TYPES).toHaveLength(7);
  });

  it('derives BugType (S-048 TS-2)', () => {
    expectTypeOf<BugType>().toEqualTypeOf<
      | 'off_by_one'
      | 'comparison'
      | 'wrong_operator'
      | 'wrong_variable'
      | 'bad_initialization'
      | 'misplaced_return'
      | 'inverted_condition'
    >();
  });

  it('keeps BUG_TYPES read-only (S-048 TS-3)', () => {
    const mutate = (): void => {
      // @ts-expect-error BUG_TYPES is readonly
      BUG_TYPES.push('null_pointer');
    };
    expectTypeOf(mutate).toBeFunction();
  });

  it('rejects invented BugType values (S-048 TS-4)', () => {
    const ok: BugType = 'misplaced_return';
    // @ts-expect-error 'null_pointer' is not a BugType
    const bad: BugType = 'null_pointer';
    expect(ok).toBe('misplaced_return');
    expect(bad).toBe('null_pointer');
  });

  it('works with z.enum for the payload and result schemas (S-048 TS-5)', () => {
    const schema = z.strictObject({ bug_type: z.enum(BUG_TYPES) });
    const good = schema.safeParse({ bug_type: 'off_by_one' });
    expect(good.success).toBe(true);
    expect(good.data).toEqual({ bug_type: 'off_by_one' });
    expect(schema.safeParse({ bug_type: 'null_pointer' }).success).toBe(false);
    expect(schema.safeParse({ bug_type: 'OFF_BY_ONE' }).success).toBe(false);
    expect(schema.safeParse({ bug_type: '' }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it('keys extra.by_bug_type stats by BugType (S-048 TS-6)', () => {
    const byBugType: Partial<Record<BugType, { played: number; correct: number }>> = {
      comparison: { played: 2, correct: 1 },
      off_by_one: { played: 1, correct: 0 },
    };
    const badStats: Partial<Record<BugType, { played: number; correct: number }>> = {
      // @ts-expect-error 'null_pointer' is not a BugType
      null_pointer: { played: 1, correct: 1 },
    };
    expectTypeOf<keyof Record<BugType, number>>().toEqualTypeOf<BugType>();
    expect(byBugType.comparison).toEqual({ played: 2, correct: 1 });
    expect(byBugType.wrong_operator).toBeUndefined();
    expect(badStats).toBeDefined();
  });

  it('uses unique snake_case values (S-048 TS-7)', () => {
    expect(BUG_TYPES.every((t) => /^[a-z]+(_[a-z]+)*$/.test(t))).toBe(true);
    expect(new Set(BUG_TYPES).size).toBe(7);
  });
});
