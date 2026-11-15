import { AppError } from '@nerdose/core';
import { bigO } from '@nerdose/game-big-o/definition';
import { bugHunt } from '@nerdose/game-bug-hunt/definition';
import { describe, expect, it } from 'vitest';

import { games } from '@/games/registry';

import { registryWithoutBugHunt } from './helpers/registries';

function notFound(fn: () => unknown) {
  try {
    fn();
    expect.unreachable();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'not_found', status: 404 });
  }
}

describe('games registry', () => {
  it('TS-1 registra los 5 juegos; get lanza not_found fuera del registry (S-048 TS-1)', () => {
    expect(games.ids()).toEqual(['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt']);
    expect(games.get('devdle').id).toBe('devdle');
    expect(games.get('grep-grid').id).toBe('grep-grid');
    expect(games.get('timeline').id).toBe('timeline');
    expect(games.get('big-o')).toBe(bigO);
    expect(games.get('big-o')).toMatchObject({ id: 'big-o', bankUsage: null });
    expect(games.get('bug-hunt')).toBe(bugHunt);
    expect(games.get('bug-hunt')).toMatchObject({ id: 'bug-hunt', bankUsage: null });
    notFound(() => games.get('foo' as never));
    expect(registryWithoutBugHunt.ids()).toEqual(['devdle', 'grep-grid', 'timeline', 'big-o']);
    notFound(() => registryWithoutBugHunt.get('bug-hunt'));
  });
});
