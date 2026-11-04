import { AppError } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { games } from '@/games/registry';

describe('games registry', () => {
  it('está vacío y get lanza not_found', () => {
    expect(games.ids()).toEqual([]);
    try {
      games.get('devdle');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ code: 'not_found', status: 404 });
    }
  });
});
