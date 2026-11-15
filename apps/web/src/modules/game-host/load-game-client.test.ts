import { describe, expect, it } from 'vitest';

import type { GameId } from '@nerdose/core';

import i18n from '@/i18n';

import { loadGameClient } from './load-game-client';

describe('loadGameClient', () => {
  it('TS-7: carga el client, registra su i18n y se memoiza', async () => {
    const first = loadGameClient('devdle');
    const second = loadGameClient('devdle');
    expect(first).toBe(second);
    const client = await first;
    expect(typeof client.Instructions).toBe('function');
    expect(typeof client.Game).toBe('function');
    expect(typeof client.Result).toBe('function');
    expect(typeof client.share).toBe('function');
    expect(client.i18n.namespace).toBe('devdle');
    expect(client.HELP_TARGET_ID).toBe('game-help');
    expect(i18n.hasResourceBundle('es', 'devdle')).toBe(true);
    expect(i18n.hasResourceBundle('en', 'devdle')).toBe(true);
  });

  it('TS-4: carga el client de Grep Grid y registra su i18n', async () => {
    const first = loadGameClient('grep-grid');
    expect(loadGameClient('grep-grid')).toBe(first);
    const client = await first;
    expect(typeof client.Instructions).toBe('function');
    expect(typeof client.Game).toBe('function');
    expect(typeof client.Result).toBe('function');
    expect(typeof client.share).toBe('function');
    expect(client.i18n.namespace).toBe('grep-grid');
    expect(client.HELP_TARGET_ID).toBe('game-help');
    expect(i18n.hasResourceBundle('es', 'grep-grid')).toBe(true);
    expect(i18n.hasResourceBundle('en', 'grep-grid')).toBe(true);
    expect(i18n.t('hint.idle', { ns: 'grep-grid' })).toBe('> tocá la primera letra de una palabra');
  });

  it('TS-4: carga el client de Timeline y registra su i18n', async () => {
    const first = loadGameClient('timeline');
    expect(loadGameClient('timeline')).toBe(first);
    const client = await first;
    expect(typeof client.Instructions).toBe('function');
    expect(typeof client.Game).toBe('function');
    expect(typeof client.Result).toBe('function');
    expect(typeof client.share).toBe('function');
    expect(client.i18n.namespace).toBe('timeline');
    expect(client.HELP_TARGET_ID).toBe('game-help');
    expect(i18n.hasResourceBundle('es', 'timeline')).toBe(true);
    expect(i18n.hasResourceBundle('en', 'timeline')).toBe(true);
    expect(i18n.t('game.confirm', { ns: 'timeline' })).toBe('Confirmar orden');
  });

  it('TS-2: carga el client de Big O y registra su i18n', async () => {
    const first = loadGameClient('big-o');
    expect(loadGameClient('big-o')).toBe(first);
    const client = await first;
    expect(typeof client.Instructions).toBe('function');
    expect(typeof client.Game).toBe('function');
    expect(typeof client.Result).toBe('function');
    expect(typeof client.share).toBe('function');
    expect(client.i18n.namespace).toBe('big-o');
    expect(client.HELP_TARGET_ID).toBe('game-help');
    expect(i18n.hasResourceBundle('es', 'big-o')).toBe(true);
    expect(i18n.hasResourceBundle('en', 'big-o')).toBe(true);
    expect(i18n.t('game.confirm', { ns: 'big-o' })).toBe('Confirmar respuesta');
  });

  it('TS-2: carga el client de Bug Hunt y registra su i18n', async () => {
    const first = loadGameClient('bug-hunt');
    expect(loadGameClient('bug-hunt')).toBe(first);
    const client = await first;
    expect(typeof client.Instructions).toBe('function');
    expect(typeof client.Game).toBe('function');
    expect(typeof client.Result).toBe('function');
    expect(typeof client.share).toBe('function');
    expect(client.i18n.namespace).toBe('bug-hunt');
    expect(client.HELP_TARGET_ID).toBe('game-help');
    expect(i18n.hasResourceBundle('es', 'bug-hunt')).toBe(true);
    expect(i18n.hasResourceBundle('en', 'bug-hunt')).toBe(true);
    expect(i18n.t('game.confirmIdle', { ns: 'bug-hunt' })).toBe('Elegí una línea');
  });

  it('rechaza si el juego no tiene client', async () => {
    await expect(loadGameClient('unknown-game' as GameId)).rejects.toThrow('unknown-game');
  });
});
