import { AppError } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { parseWordlistArgs } from '../scripts/build-wordlist/args';
import { loadWordlistEnv } from '../scripts/build-wordlist/env';

const validation = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    expect((e as AppError).code).toBe('validation_error');
    return;
  }
  throw new Error('did not throw');
};

describe('wordlist env and args (TS-60)', () => {
  it('requires WIKIMEDIA_CONTACT', () => {
    validation(() => loadWordlistEnv({}));
    validation(() => loadWordlistEnv({ WIKIMEDIA_CONTACT: '  ' }));
    expect(loadWordlistEnv({ WIKIMEDIA_CONTACT: 'dev@example.com' })).toEqual({
      WIKIMEDIA_CONTACT: 'dev@example.com',
    });
  });

  it('parses --enable', () => {
    expect(parseWordlistArgs(['--enable', '/tmp/enable1.txt'])).toEqual({
      enable: '/tmp/enable1.txt',
    });
    validation(() => parseWordlistArgs([]));
    validation(() => parseWordlistArgs(['--foo']));
  });
});
