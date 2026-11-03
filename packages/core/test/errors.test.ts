import { describe, expect, expectTypeOf, it } from 'vitest';

import { AppError, ERROR_CATALOG, type ErrorCode } from '../src/errors';

describe('ERROR_CATALOG', () => {
  it('is the closed catalog of 21 codes (TS-3)', () => {
    expect(ERROR_CATALOG).toEqual({
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
      validation_error: { status: 422 },
      rate_limited: { status: 429 },
      internal_error: { status: 500 },
    });
    expect(Object.keys(ERROR_CATALOG)).toHaveLength(21);
  });
});

describe('AppError', () => {
  it('takes its status from the catalog (TS-4)', () => {
    const error = new AppError('not_found');
    expect(error.status).toBe(404);
    expect(error.code).toBe('not_found');
    expect(error.name).toBe('AppError');
    expect(error.message).toBe('not_found');
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });

  it.each(Object.keys(ERROR_CATALOG) as ErrorCode[])('maps %s to its status (TS-5)', (code) => {
    const error = new AppError(code);
    expect(error.status).toBe(ERROR_CATALOG[code].status);
    expect(error.code).toBe(code);
  });

  it('accepts a custom message (TS-6)', () => {
    const error = new AppError('rate_limited', 'Demasiadas solicitudes');
    expect(error.message).toBe('Demasiadas solicitudes');
    expect(error.code).toBe('rate_limited');
    expect(error.status).toBe(429);
  });

  it('has a closed ErrorCode union (TS-7)', () => {
    // @ts-expect-error 'teapot' is not in the catalog
    const bad = () => new AppError('teapot');
    expect(bad).toBeTypeOf('function');
    expectTypeOf<ErrorCode>().toEqualTypeOf<keyof typeof ERROR_CATALOG>();
  });
});
