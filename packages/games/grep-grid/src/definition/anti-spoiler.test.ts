import { describe, expect, it } from 'vitest';

import { grepGrid } from './index';
import { CTX_ES, NOW, PAYLOAD, S0, cellsOf, playAll, select, selectWord } from './test-fixtures';

const json = (x: unknown) => JSON.stringify(x);
const c = (row: number, col: number) => ({ row, col });
const S3 = playAll([selectWord('DOCKER'), selectWord('REDIS'), selectWord('MERGE')]).state;
const FORBIDDEN_KEYS = ['"placements"', '"from"', '"to"', '"direction"', '"cells"'];

function undiscovered(state: typeof S0) {
  const found = new Set(state.found_words.map((f) => f.term_id));
  return PAYLOAD.words.filter((w) => !found.has(w.term_id));
}

describe('grep-grid anti-spoiler contract (NFR-S01)', () => {
  const states = [
    ['no state', undefined, S0],
    ['initial state', S0, S0],
    ['3 found', S3, S3],
  ] as const;

  it.each(states)('toPublic with %s never leaks positions (TS-43)', (_n, state) => {
    for (const locale of ['es', 'en'] as const) {
      const out = json(grepGrid.toPublic(PAYLOAD, locale, state));
      for (const k of FORBIDDEN_KEYS) expect(out).not.toContain(k);
    }
  });

  it.each([
    [0, []],
    [1, ['DOCKER']],
    [3, ['DOCKER', 'REDIS', 'MERGE']],
    [7, ['DOCKER', 'REDIS', 'MERGE', 'CACHE', 'KERNEL', 'OAUTH', 'PYTHON']],
  ] as const)(
    'at %i found, no pre-result response leaks undiscovered definitions (TS-43)',
    (_k, words) => {
      const { state } = playAll(words.map(selectWord));
      const hidden = undiscovered(state);
      const responses = [
        grepGrid.initState(PAYLOAD, NOW),
        grepGrid.toPublic(PAYLOAD, 'es'),
        grepGrid.toPublic(PAYLOAD, 'es', state),
        grepGrid.toPublic(PAYLOAD, 'en', state),
        grepGrid.applyMove(PAYLOAD, state, select(c(10, 0), c(10, 5)), NOW, CTX_ES),
        grepGrid.applyMove(PAYLOAD, state, select(c(3, 7), c(3, 2)), NOW, CTX_ES),
      ].map(json);
      for (const out of responses) {
        for (const w of hidden) {
          expect(out).not.toContain(w.definition.es);
          expect(out).not.toContain(w.definition.en);
        }
      }
    },
  );

  it('applyMove returns never carry positions beyond the found word (TS-43)', () => {
    const moves = [
      select(c(0, 0), c(0, 3)),
      select(c(10, 0), c(10, 5)),
      select(c(3, 7), c(3, 2)),
      selectWord('DOCKER'),
    ];
    for (const m of moves) {
      const out = json(grepGrid.applyMove(PAYLOAD, S3, m, NOW, CTX_ES));
      for (const k of ['"placements"', '"from"', '"to"', '"direction"'])
        expect(out).not.toContain(k);
    }
    const dup = json(grepGrid.applyMove(PAYLOAD, S3, selectWord('DOCKER'), NOW, CTX_ES));
    expect(dup).not.toContain('definición de CACHE');
  });

  it('feedback and state expose only the cells of the found word (TS-43)', () => {
    const r = grepGrid.applyMove(PAYLOAD, S0, selectWord('DOCKER'), NOW, CTX_ES);
    if ('error' in r) throw new Error('unexpected');
    expect(r.feedback).toMatchObject({ cells: cellsOf('DOCKER') });
    expect(r.state.found_words.map((f) => f.cells)).toEqual([cellsOf('DOCKER')]);
  });

  it('each Feedback variant carries only its own fields (TS-44)', () => {
    const found = playAll([selectWord('DOCKER')]).feedback;
    const notAWord = playAll([select(c(0, 0), c(0, 3))]).feedback;
    const already = playAll([selectWord('DOCKER'), selectWord('DOCKER')]).feedback;
    const giveUp = grepGrid.applyMove(PAYLOAD, S0, { type: 'give_up' }, NOW, CTX_ES);
    expect(Object.keys(found ?? {}).sort()).toEqual([
      'cells',
      'definition',
      'found',
      'term_id',
      'word',
    ]);
    expect(Object.keys(notAWord ?? {}).sort()).toEqual(['found', 'reason']);
    expect(Object.keys(already ?? {}).sort()).toEqual(['found', 'reason']);
    expect('feedback' in giveUp && giveUp.feedback).toBeNull();
    for (const f of [notAWord, already]) {
      expect(json(f)).not.toContain('cells');
      expect(json(f)).not.toContain('definition');
    }
  });

  it('toPublic does not depend on placements (TS-42)', () => {
    const stripped = { ...PAYLOAD, placements: [] } as unknown as typeof PAYLOAD;
    expect(grepGrid.toPublic(stripped, 'es', S3)).toEqual(grepGrid.toPublic(PAYLOAD, 'es', S3));
  });
});
