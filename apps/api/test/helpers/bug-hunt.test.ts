import { bugHunt } from '@nerdose/game-bug-hunt/definition';
import { describe, expect, it } from 'vitest';

import {
  BH_FORBIDDEN,
  BH_PAYLOAD,
  BH_PAYLOAD_BOOL,
  BH_PUBLIC_EN,
  BH_PUBLIC_ES,
  LOST_GO,
  WON_JAVA,
  bhResult,
  bhStats,
} from './bug-hunt';

describe('fixture de Bug Hunt', () => {
  it('TS-9 coincide con la definición real (S-048 TS-9)', () => {
    expect(bugHunt.toPublic(BH_PAYLOAD, 'es')).toEqual(BH_PUBLIC_ES);
    expect(bugHunt.toPublic(BH_PAYLOAD, 'en')).toEqual(BH_PUBLIC_EN);
    expect(bugHunt.toPublic(BH_PAYLOAD, 'es', WON_JAVA)).toEqual(BH_PUBLIC_ES);
    expect(bugHunt.result(BH_PAYLOAD, WON_JAVA, 'es')).toEqual(bhResult(WON_JAVA, 'es'));
    expect(bugHunt.result(BH_PAYLOAD, WON_JAVA, 'en')).toEqual(bhResult(WON_JAVA, 'en'));
    expect(bugHunt.result(BH_PAYLOAD, LOST_GO, 'es')).toEqual(bhResult(LOST_GO, 'es'));
    expect(bugHunt.result(BH_PAYLOAD_BOOL, { language: 'js', line: 2 }, 'es')).toMatchObject({
      win: true,
      score: 1,
      bug_line: 2,
      bug_type: 'bad_initialization',
      function_name: 'anyAbove',
      failing_test: { input: [[], 3], expected: false, actual: true },
      fix: { js: { before: '  let found = true;', after: '  let found = false;' } },
    });
    expect(bugHunt.historyLabel(bhResult(WON_JAVA, 'es'))).toBe('✓ L4');
    expect(bugHunt.historyLabel(bhResult(LOST_GO, 'es'))).toBe('✗ L4');
    expect(bugHunt.reduceStats(bugHunt.initialStats(), bhResult(WON_JAVA, 'es'))).toEqual(
      bhStats('java', true),
    );
  });

  it('BH_FORBIDDEN no matchea la vista pública legítima', () => {
    for (const raw of [JSON.stringify(BH_PUBLIC_ES), JSON.stringify(BH_PUBLIC_EN)]) {
      for (const v of BH_FORBIDDEN) expect(raw).not.toContain(v);
    }
  });
});
