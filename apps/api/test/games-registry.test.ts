import { AppError } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { games } from '@/games/registry';

describe('games registry', () => {
  it('TS-1 registra devdle, grep-grid y timeline; get lanza not_found para un juego sin paquete', () => {
    expect(games.ids()).toEqual(['devdle', 'grep-grid', 'timeline']);
    expect(games.get('devdle').id).toBe('devdle');
    expect(games.get('grep-grid').id).toBe('grep-grid');
    expect(games.get('timeline').id).toBe('timeline');
    try {
      games.get('big-o');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ code: 'not_found', status: 404 });
    }
  });
});
