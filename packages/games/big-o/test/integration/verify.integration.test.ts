import type { VerificationCheck, VerificationLog } from '@nerdose/core';
import { beforeAll, describe, expect, it } from 'vitest';

import { payloadSchema, type BigOPayload } from '../../src/definition';
import { PAYLOAD } from '../../src/definition/test-fixtures';
import { paramCombos } from '../../src/generator/catalog/params';
import { RECIPES } from '../../src/generator/catalog/recipes';
import { buildPayload, generate } from '../../src/generator/generate';
import { D, emptyHistory, recipe, seed, withDate } from '../../src/generator/test-fixtures';
import { createVerify, verify } from '../../src/generator/verify';

import { requireToolchains } from './toolchains';

const P = withDate(PAYLOAD);
const named = (log: VerificationLog, name: string) =>
  log.checks.find((c) => c.name === name) as VerificationCheck;

function mutated(lang: 'js' | 'go' | 'java', from: string, to: string): BigOPayload {
  const p = structuredClone(P);
  expect(p.code[lang]).toContain(from);
  p.code[lang] = p.code[lang].replace(from, to);
  return p;
}

beforeAll(async () => {
  await requireToolchains();
});

describe.concurrent('the whole catalog runs and fits (TS-29)', () => {
  for (const r of RECIPES) {
    for (const params of paramCombos(r)) {
      it(`${r.id} ${JSON.stringify(params)}`, async () => {
        const log = await verify({ ...buildPayload(r, params), date: D }, emptyHistory);
        expect(log.checks.filter((c) => !c.ok)).toEqual([]);
        expect(log.ok).toBe(true);
        expect(log.reason).toBeUndefined();
        expect(named(log, 'fit_matches_answer').detail).toBe(`best=${r.answer} answer=${r.answer}`);
      });
    }
  }
});

describe.concurrent('generate then verify (TS-30)', () => {
  for (let k = 1; k <= 6; k++) {
    it(`seed ${k}`, async () => {
      const p = generate({ date: D, seed: seed(k), history: emptyHistory });
      const log = await verify(payloadSchema.parse(p), emptyHistory);
      expect(log.ok).toBe(true);
      expect(p.date).toBe(D);
    });
  }
});

describe('verify with real toolchains', () => {
  it('nested linear loops are O(n^2) end to end (TS-31)', async () => {
    const p = { ...buildPayload(recipe('nest(linear,linear)'), [1, 1]), date: D };
    const log = await verify(p, emptyHistory);
    expect(log.ok).toBe(true);
    expect(named(log, 'counts_agree').detail).toBe(
      'n=64,128,256,512,1024,2048,4096 counts=4096,16384,65536,262144,1048576,4194304,16777216',
    );
    expect(named(log, 'fit_matches_answer').detail).toBe('best=o_n2 answer=o_n2');
    for (const n of ['run_js', 'run_go', 'run_java']) {
      expect(named(log, n).detail).toMatch(/^\d+ ms$/);
    }
  });

  it('rejects a real compile error (TS-32)', async () => {
    const log = await verify(mutated('go', '\tops := 0', '\tops := 0; x := 1'), emptyHistory);
    expect(log.reason).toBe('run_go: compile_error');
    expect(named(log, 'run_go').detail).toMatch(
      /^compile_error \(\d+ ms\): .*declared and not used: x/,
    );
    expect(named(log, 'run_js').ok).toBe(true);
    expect(named(log, 'run_java').ok).toBe(true);
    for (const n of ['counts_agree', 'counts_in_range', 'fit_quality', 'fit_matches_answer']) {
      expect(named(log, n)).toMatchObject({ ok: false, detail: 'skipped' });
    }
  });

  it('rejects languages that disagree (TS-33)', async () => {
    const log = await verify(mutated('java', 'j *= 2', 'j *= 3'), emptyHistory);
    expect(log.reason).toBe('counts_agree');
    expect(named(log, 'counts_agree').detail).toMatch(/^differs at n=\d+: js=\d+ go=\d+ java=\d+$/);
    for (const n of ['run_js', 'run_go', 'run_java']) expect(named(log, n).ok).toBe(true);
  });

  it('rejects a real timeout (TS-34)', async () => {
    const started = Date.now();
    const log = await createVerify({ timeoutMs: 2000 })(
      mutated('js', 'j *= 2', 'j *= 1'),
      emptyHistory,
    );
    expect(Date.now() - started).toBeLessThan(15_000);
    expect(log.reason).toBe('run_js: timeout');
    expect(named(log, 'run_js').detail).toMatch(/^timeout \(\d+ ms\)$/);
    expect(named(log, 'run_go').ok).toBe(true);
    expect(named(log, 'run_java').ok).toBe(true);
  });
});
