import { describe, expect, it } from 'vitest';

import { boMove, boResult, BO_OPTIONS } from './big-o-today';

describe('fixtures de Big O', () => {
  it('boResult gana solo con o_n_log_n', () => {
    for (const option of BO_OPTIONS) {
      expect(boResult(option, 'js').win).toBe(option === 'o_n_log_n');
    }
  });

  it('boMove lleva el lenguaje en play.code_language', () => {
    expect(boMove('o_n', 'go').play.code_language).toBe('go');
    expect(boMove('o_n_log_n', 'java').play.status).toBe('won');
  });
});
