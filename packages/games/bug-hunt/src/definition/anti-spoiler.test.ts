import { CODE_LANGUAGES } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { bugHunt } from './index';
import { CTX_ES, NOW, PAYLOAD, PAYLOAD_BOOL, WON_JAVA } from './test-fixtures';

const PAYLOADS = [PAYLOAD, PAYLOAD_BOOL];

const FORBIDDEN_KEYS = [
  '"bug_line"',
  '"bug_type"',
  '"mutation"',
  '"fix"',
  '"failing_test"',
  '"tests"',
  '"template"',
  '"params"',
  '"explanation"',
  '"actual"',
  '"steps"',
  '"operator"',
];

const FORBIDDEN_VALUES: string[] = PAYLOADS.flatMap((p) => {
  const visible = new Set(p.visible_tests.map((t) => JSON.stringify(t.input)));
  return [
    p.template,
    p.mutation.operator,
    p.bug_type,
    p.fix.js,
    p.fix.go,
    p.fix.java,
    ...p.explanation.steps.flatMap((s) => [s.es, s.en]),
    ...p.tests.map((t) => JSON.stringify(t.input)).filter((i) => !visible.has(i)),
  ];
});
FORBIDDEN_VALUES.push(PAYLOAD.mutation.node);

const ser = (f: string) => (f.startsWith('"') ? f : JSON.stringify(f).slice(1, -1));

describe('bug-hunt anti-spoiler contract', () => {
  it('toPublic exposes exactly the 5 public keys (TS-32)', () => {
    for (const p of PAYLOADS) {
      for (const l of ['es', 'en'] as const) {
        for (const s of [undefined, {}]) {
          const view = bugHunt.toPublic(p, l, s);
          expect(Object.keys(view)).toEqual([
            'function_name',
            'spec',
            'code',
            'pickable_lines',
            'visible_tests',
          ]);
          expect(Object.keys(view.code)).toEqual(['js', 'go', 'java']);
          expect(view.pickable_lines).toEqual([...view.pickable_lines].sort((a, b) => a - b));
          expect(new Set(view.pickable_lines).size).toBe(view.pickable_lines.length);
          for (const t of view.visible_tests) {
            expect(Object.keys(t)).toEqual(['input', 'expected']);
            expect(t.input).not.toEqual(p.failing_test.input);
          }
        }
      }
    }
  });

  it('no pre-result response contains a solution key or value (TS-33)', () => {
    const payloadJson = JSON.stringify(PAYLOADS);
    for (const f of FORBIDDEN_KEYS) {
      expect(payloadJson.includes(f), `fixture lacks ${f}`).toBe(true);
    }
    for (const f of FORBIDDEN_VALUES) {
      expect(payloadJson.includes(ser(f)), `fixture lacks ${f}`).toBe(true);
    }
    const responses = [
      bugHunt.toPublic(PAYLOAD, 'es'),
      bugHunt.toPublic(PAYLOAD, 'en', {}),
      bugHunt.toPublic(PAYLOAD_BOOL, 'es', {}),
      bugHunt.toPublic(PAYLOAD_BOOL, 'en'),
      bugHunt.initState(PAYLOAD, NOW),
      bugHunt.applyMove(PAYLOAD, {}, { language: CODE_LANGUAGES[0], line: 1 }, NOW, CTX_ES),
      bugHunt.applyMove(PAYLOAD, WON_JAVA, { language: 'go', line: 5 }, NOW, CTX_ES),
    ].map((r) => JSON.stringify(r));
    for (const json of responses) {
      for (const f of [...FORBIDDEN_KEYS, ...FORBIDDEN_VALUES]) {
        expect(json.includes(ser(f)), `${json} contains ${f}`).toBe(false);
      }
    }
  });
});
