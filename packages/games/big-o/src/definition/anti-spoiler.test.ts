import { BIG_O_OPTIONS } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { bigO } from './index';
import {
  CTX_ES,
  NOW,
  PAYLOAD,
  PAYLOAD_RECURSION,
  WON_JAVA,
  withAnswer,
} from './test-fixtures';

const FORBIDDEN_KEYS = [
  '"answer"',
  '"trap_option"',
  '"explanation"',
  '"recipe"',
  '"recipe_category"',
  '"steps"',
  '"line_notes"',
  '"tip"',
  '"example"',
];

const FORBIDDEN_VALUES = [PAYLOAD, PAYLOAD_RECURSION].flatMap((p) => [
  p.recipe,
  p.recipe_category,
  ...p.explanation.steps.flatMap((s) => [s.es, s.en]),
  ...p.explanation.line_notes.flatMap((n) => [n.text.es, n.text.en]),
  ...(p.explanation.tip ? [p.explanation.tip.es, p.explanation.tip.en] : []),
  ...(p.explanation.example
    ? [String(p.explanation.example.ops), String(p.explanation.example.trap_ops)]
    : []),
]);
FORBIDDEN_VALUES.push('φ');

describe('big-o anti-spoiler contract', () => {
  it.each(['es', 'en'] as const)('toPublic exposes exactly code and options in %s (TS-30)', (l) => {
    for (const p of [PAYLOAD, PAYLOAD_RECURSION]) {
      for (const s of [undefined, {}]) {
        const view = bigO.toPublic(p, l, s);
        expect(Object.keys(view)).toEqual(['code', 'options']);
        expect(Object.keys(view.code)).toEqual(['js', 'go', 'java']);
        expect(view.options).toEqual([...BIG_O_OPTIONS]);
      }
    }
  });

  it('options are fixed for every possible answer (TS-13)', () => {
    for (const a of BIG_O_OPTIONS) {
      expect(bigO.toPublic(withAnswer(a), 'es').options).toEqual([...BIG_O_OPTIONS]);
    }
  });

  it('no pre-result response contains a solution key or value (TS-31)', () => {
    const payloadJson = JSON.stringify([PAYLOAD, PAYLOAD_RECURSION]);
    for (const f of FORBIDDEN_KEYS) {
      expect(payloadJson.includes(f), `fixture lacks ${f}`).toBe(true);
    }
    for (const f of FORBIDDEN_VALUES) {
      expect(payloadJson.includes(JSON.stringify(f).slice(1, -1)), `fixture lacks ${f}`).toBe(true);
    }
    const responses = [
      bigO.toPublic(PAYLOAD, 'es'),
      bigO.toPublic(PAYLOAD, 'en', {}),
      bigO.toPublic(PAYLOAD_RECURSION, 'es', {}),
      bigO.initState(PAYLOAD, NOW),
      bigO.applyMove(PAYLOAD, WON_JAVA, { language: 'go', option: 'o_n2' }, NOW, CTX_ES),
    ].map((r) => JSON.stringify(r));
    for (const json of responses) {
      for (const f of [...FORBIDDEN_KEYS, ...FORBIDDEN_VALUES]) {
        expect(json.includes(f), `${json} contains ${f}`).toBe(false);
      }
    }
  });
});
