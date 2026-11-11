export const ERROR_CATALOG = {
  no_session: { status: 401 },
  unauthorized: { status: 401 },
  invalid_credentials: { status: 401 },
  forbidden_origin: { status: 403 },
  no_challenge_today: { status: 404 },
  not_found: { status: 404 },
  challenge_expired: { status: 409 },
  challenge_voided: { status: 409 },
  game_finished: { status: 409 },
  already_reported: { status: 409 },
  not_voidable: { status: 409 },
  not_regenerable: { status: 409 },
  not_voided: { status: 409 },
  report_not_open: { status: 409 },
  unsupported_media_type: { status: 415 },
  invalid_move: { status: 422 },
  not_in_word_list: { status: 422 },
  invalid_report: { status: 422 },
  invalid_culprit: { status: 422 },
  validation_error: { status: 422 },
  rate_limited: { status: 429 },
  internal_error: { status: 500 },
} as const;

export type ErrorCode = keyof typeof ERROR_CATALOG;

export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AppError';
    this.status = ERROR_CATALOG[code].status;
  }
}
