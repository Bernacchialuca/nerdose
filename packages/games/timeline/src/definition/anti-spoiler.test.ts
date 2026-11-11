import { describe, expect, it } from 'vitest';

import { timeline } from './index';
import { CORRECT, CTX_ES, NOW, PAYLOAD, S0, move } from './test-fixtures';

const FORBIDDEN_KEYS = [
  '"correct_order"',
  '"event_date"',
  '"date_precision"',
  '"note"',
  '"fact_id"',
];
const FORBIDDEN_VALUES = PAYLOAD.items.flatMap((i) => [
  i.fact_id,
  i.event_date,
  i.event_date.slice(0, 4),
  i.note.es,
  i.note.en,
]);
const FORBIDDEN = [...FORBIDDEN_KEYS, ...FORBIDDEN_VALUES, 'nota de ', 'note on '];

const invalidMoves = [
  CORRECT.slice(0, 4),
  ['p7k2m9', 'p7k2m9', 'g2n5w3', 'd9r6t0', 'k1v3s8'],
  ['p7k2m9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'zzzzzz'],
  ['P7K2M9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'k1v3s8'],
];

describe('timeline anti-spoiler contract', () => {
  it.each(['es', 'en'] as const)(
    'toPublic exposes exactly the contracted keys in %s (TS-37)',
    (l) => {
      for (const s of [undefined, {}]) {
        const view = timeline.toPublic(PAYLOAD, l, s);
        expect(Object.keys(view)).toEqual(['category', 'prompt', 'items']);
        for (const item of view.items) expect(Object.keys(item)).toEqual(['opaque_id', 'label']);
      }
    },
  );

  it('no pre-result response contains a solution value (TS-38)', () => {
    const responses = [
      timeline.toPublic(PAYLOAD, 'es'),
      timeline.toPublic(PAYLOAD, 'en', {}),
      timeline.initState(PAYLOAD, NOW),
      ...invalidMoves.map((o) => timeline.applyMove(PAYLOAD, S0, move(o), NOW, CTX_ES)),
      timeline.applyMove(PAYLOAD, { order: CORRECT }, move(CORRECT), NOW, CTX_ES),
      timeline.applyMove(PAYLOAD, S0, move([...CORRECT].reverse()), NOW, CTX_ES),
    ].map((r) => JSON.stringify(r));
    for (const json of responses) {
      for (const f of FORBIDDEN) expect(json.includes(f), `${json} contains ${f}`).toBe(false);
    }
  });

  it('the public order is not the correct order (TS-39)', () => {
    const ids = timeline.toPublic(PAYLOAD, 'es').items.map((i) => i.opaque_id);
    expect(ids).toEqual(['g2n5w3', 'k1v3s8', 'p7k2m9', 'd9r6t0', 'j4x8q1']);
    expect(ids).not.toEqual(CORRECT);
  });
});
