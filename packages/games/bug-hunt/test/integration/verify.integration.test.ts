import type { VerificationCheck, VerificationLog } from '@nerdose/core';
import { beforeAll, describe, expect, it } from 'vitest';

import { payloadSchema, type BugHuntPayload } from '../../src/definition';
import { PAYLOAD, PAYLOAD_BOOL } from '../../src/definition/test-fixtures';
import { bugTypesOf, TEMPLATES } from '../../src/generator/catalog';
import { generate } from '../../src/generator/generate';
import { D, emptyHistory, seed } from '../../src/generator/test-fixtures';
import { catalogPayload } from '../../src/generator/test-utils';
import { createVerify, verify } from '../../src/generator/verify';

import { requireToolchains } from './toolchains';

const P = PAYLOAD;
const named = (log: VerificationLog, name: string) =>
  log.checks.find((c) => c.name === name) as VerificationCheck;

function withLine(lang: 'js' | 'go' | 'java', line: number, text: string): BugHuntPayload {
  const p = structuredClone(P);
  const lines = p.code[lang].split('\n');
  expect(lines[line - 1]).toBeDefined();
  lines[line - 1] = text;
  p.code[lang] = lines.join('\n');
  return p;
}

beforeAll(async () => {
  await requireToolchains();
});

describe.concurrent('the whole catalog runs and agrees (TS-31)', () => {
  for (const t of TEMPLATES) {
    for (const b of bugTypesOf(t)) {
      it(`${t.id} ${b}`, async () => {
        const log = await verify(catalogPayload(t, b), emptyHistory);
        expect(log.checks.filter((c) => !c.ok)).toEqual([]);
        expect(log.ok).toBe(true);
        expect(log.reason).toBeUndefined();
        for (const v of ['correct', 'mutant']) {
          for (const l of ['js', 'go', 'java']) {
            expect(named(log, `run_${v}_${l}`).detail).toMatch(/^\d+ ms$/);
          }
        }
        expect(named(log, 'correct_agrees').detail).toBe('10 tests');
      });
    }
  }
});

describe.concurrent('generate then verify and the definition fixtures (TS-32)', () => {
  for (let k = 1; k <= 6; k++) {
    it(`seed ${k}`, async () => {
      const p = payloadSchema.parse(generate({ date: D, seed: seed(k), history: emptyHistory }));
      const log = await verify(p, emptyHistory);
      expect(log.ok).toBe(true);
      expect(p.date).toBe(D);
    });
  }
  it.each([
    ['PAYLOAD', PAYLOAD],
    ['PAYLOAD_BOOL', PAYLOAD_BOOL],
  ])('%s', async (_n, p) => {
    const log = await verify(p, emptyHistory);
    expect(log.ok).toBe(true);
    expect(named(log, 'correct_agrees').detail).toBe('8 tests');
  });
});

describe('verify with real toolchains', () => {
  it('rejects a real compile error (TS-33)', async () => {
    const log = await verify(withLine('go', 2, '\tbest := 0; x := 1'), emptyHistory);
    expect(log.reason).toBe('run_correct_go: compile_error');
    const re = /^compile_error \(\d+ ms\): \.\/main\.go:\d+:\d+: declared and not used: x$/;
    expect(named(log, 'run_correct_go').detail).toMatch(re);
    expect(named(log, 'run_mutant_go').detail).toMatch(re);
    for (const n of ['run_correct_js', 'run_mutant_js', 'run_correct_java', 'run_mutant_java']) {
      expect(named(log, n).ok).toBe(true);
    }
    expect(named(log, 'correct_agrees')).toMatchObject({ ok: false, detail: 'skipped' });
    expect(named(log, 'mutant_agrees')).toMatchObject({ ok: false, detail: 'skipped' });
  });

  it('rejects a correct version that disagrees between languages (TS-34)', async () => {
    const log = await verify(withLine('java', 2, '    int best = 1;'), emptyHistory);
    const detail = 'differs at tests[0] maxIndex([]): js=0 go=0 java=1';
    expect(log.reason).toBe('correct_agrees');
    expect(named(log, 'correct_agrees').detail).toBe(detail);
    expect(named(log, 'mutant_agrees').detail).toBe(detail);
    expect(log.checks.slice(5, 11).every((c) => c.ok)).toBe(true);
  });

  it('rejects a mutant that disagrees between languages (TS-35)', async () => {
    const log = await verify(
      withLine('java', 4, '        if (nums[i] <= nums[best]) {'),
      emptyHistory,
    );
    expect(log.reason).toBe('mutant_agrees');
    expect(named(log, 'mutant_agrees').detail).toBe(
      'differs at tests[2] maxIndex([3, 7, 2]): js=1 go=1 java=2',
    );
    expect(named(log, 'correct_agrees')).toMatchObject({ ok: true, detail: '8 tests' });
  });

  it('kills a real timeout (TS-36)', async () => {
    const started = Date.now();
    // 5 s: Go y Java tienen que terminar dentro del mismo límite aunque la máquina esté cargada.
    const log = await createVerify({ timeoutMs: 5000 })(
      withLine('js', 3, '  for (let i = 1; i < nums.length; i--) {'),
      emptyHistory,
    );
    expect(log.reason).toBe('run_correct_js: timeout');
    expect(named(log, 'run_correct_js').detail).toMatch(/^timeout \(\d+ ms\)$/);
    expect(named(log, 'run_mutant_js').detail).toMatch(/^timeout \(\d+ ms\)$/);
    for (const n of ['run_correct_go', 'run_mutant_go', 'run_correct_java', 'run_mutant_java']) {
      expect(named(log, n).ok).toBe(true);
    }
    expect(Date.now() - started).toBeLessThan(30_000);
  });
});
