import { AppError } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { games } from '@/games/registry';

describe('games registry', () => {
  it('TS-54 registra devdle y get lanza not_found para un juego sin paquete', () => {
    expect(games.ids()).toEqual(['devdle']);
    expect(games.get('devdle').id).toBe('devdle');
    try {
      games.get('grep-grid');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ code: 'not_found', status: 404 });
    }
  });
});
