export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const CODE_LANGUAGES = ['js', 'go', 'java'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const TERM_CATEGORIES = [
  'programming_languages',
  'git',
  'databases',
  'networking',
  'linux',
  'apis',
  'security',
  'software_engineering',
] as const;
export type TermCategory = (typeof TERM_CATEGORIES)[number];

export const TIMELINE_CATEGORIES = [
  'programming_languages',
  'frameworks',
  'companies',
  'operating_systems',
  'hardware',
  'video_games',
  'databases',
  'software_tools',
] as const;
export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export const DATE_PRECISIONS = ['year', 'month', 'day'] as const;
export type DatePrecision = (typeof DATE_PRECISIONS)[number];

export const GENERATION_REQUEST_STATUSES = ['pending', 'done', 'failed', 'cancelled'] as const;
export type GenerationRequestStatus = (typeof GENERATION_REQUEST_STATUSES)[number];

export const REPORT_REASONS = [
  'wrong_answer',
  'ambiguous',
  'wrong_explanation',
  'translation',
  'display_bug',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ['open', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
