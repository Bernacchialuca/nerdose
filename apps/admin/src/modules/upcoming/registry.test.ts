import { describe, expect, it } from 'vitest';

import type { GameId } from '@nerdose/core';

import { hasPreview, previewComponent } from './registry';

describe('registry de previews', () => {
  it('lista los juegos con client y no los otros', () => {
    expect(hasPreview('devdle')).toBe(true);
    expect(hasPreview('grep-grid')).toBe(true);
    expect(hasPreview('timeline')).toBe(true);
    expect(hasPreview('big-o')).toBe(true);
    expect(hasPreview('bug-hunt')).toBe(true);
    expect(hasPreview('unknown' as GameId)).toBe(false);
  });

  it('crea un solo lazy por juego', () => {
    expect(previewComponent('devdle')).toBe(previewComponent('devdle'));
    expect(previewComponent('big-o')).toBe(previewComponent('big-o'));
    expect(previewComponent('bug-hunt')).toBe(previewComponent('bug-hunt'));
    expect(previewComponent('bug-hunt')).not.toBe(previewComponent('big-o'));
    expect(previewComponent('big-o')).not.toBe(previewComponent('devdle'));
    expect(previewComponent('devdle')).not.toBe(previewComponent('timeline'));
  });

  it('no hay componente para un juego sin client', () => {
    expect(() => previewComponent('unknown' as GameId)).toThrow(
      'El juego unknown no tiene Preview registrada',
    );
  });
});
