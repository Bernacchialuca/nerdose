import { describe, expect, it } from 'vitest';

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

  it('rechaza si el juego no tiene client', async () => {
    await expect(loadGameClient('timeline')).rejects.toThrow('timeline');
  });
});
