import { bigO } from '@nerdose/game-big-o/definition';
import { describe, expect, it } from 'vitest';

import {
  BO_PAYLOAD,
  BO_PAYLOAD_RECURSION,
  BO_PUBLIC,
  LOST_GO,
  WON_JAVA,
  boResult,
  boStats,
} from './big-o';

describe('fixture de Big O', () => {
  it('TS-8 coincide con la definición real', () => {
    expect(bigO.toPublic(BO_PAYLOAD, 'es')).toEqual(BO_PUBLIC);
    expect(bigO.toPublic(BO_PAYLOAD, 'en')).toEqual(BO_PUBLIC);
    expect(bigO.toPublic(BO_PAYLOAD, 'es', WON_JAVA)).toEqual(BO_PUBLIC);
    expect(bigO.result(BO_PAYLOAD, WON_JAVA, 'es')).toEqual(boResult(WON_JAVA, 'es'));
    expect(bigO.result(BO_PAYLOAD, WON_JAVA, 'en')).toEqual(boResult(WON_JAVA, 'en'));
    expect(bigO.result(BO_PAYLOAD, LOST_GO, 'es')).toEqual(boResult(LOST_GO, 'es'));
    expect(
      bigO.result(BO_PAYLOAD_RECURSION, { language: 'js', option: 'o_2n' }, 'es'),
    ).toMatchObject({
      win: true,
      score: 1,
      trap_option: null,
      recipe_category: 'recursion',
      explanation: { tip: null, example: null },
    });
    expect(bigO.historyLabel(boResult(WON_JAVA, 'es'))).toBe('✓ O(n log n)');
    expect(bigO.historyLabel(boResult(LOST_GO, 'es'))).toBe('✗');
    expect(bigO.reduceStats(bigO.initialStats(), boResult(WON_JAVA, 'es'))).toEqual(boStats(true));
  });
});
