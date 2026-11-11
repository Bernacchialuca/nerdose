import {
  CODE_LANGUAGES,
  DATE_PRECISIONS,
  GAME_IDS,
  LOCALES,
  REPORT_REASONS,
  REPORT_STATUSES,
  TERM_CATEGORIES,
  TIMELINE_CATEGORIES,
} from '@nerdose/core';
import { pgEnum } from 'drizzle-orm/pg-core';

export const localeEnum = pgEnum('locale', LOCALES);
export const codeLanguageEnum = pgEnum('code_language', CODE_LANGUAGES);
export const gameIdEnum = pgEnum('game_id', GAME_IDS);
export const termCategoryEnum = pgEnum('term_category', TERM_CATEGORIES);
export const timelineCategoryEnum = pgEnum('timeline_category', TIMELINE_CATEGORIES);
export const datePrecisionEnum = pgEnum('date_precision', DATE_PRECISIONS);
export const challengeStatusEnum = pgEnum('challenge_status', [
  'draft',
  'approved',
  'published',
  'rejected',
  'voided',
]);
export const playStatusEnum = pgEnum('play_status', ['in_progress', 'won', 'lost', 'voided']);
export const bankItemStatusEnum = pgEnum('bank_item_status', ['approved', 'rejected']);
export const jobRunStatusEnum = pgEnum('job_run_status', ['running', 'success', 'failed']);
export const reportReasonEnum = pgEnum('report_reason', REPORT_REASONS);
export const reportStatusEnum = pgEnum('report_status', REPORT_STATUSES);
