import { describe, expect, it } from 'vitest';
import { emit } from '../../src/emit/index';
import { LANGUAGES, type Language } from '../../src/emit/languages';
import { createTreeBuilder } from '../../src/tree/builder';
import type { Expr } from '../../src/tree/nodes';
import { drains, maxIndex, treeA, treeE } from '../fixtures/trees';

const GOLDEN_MAX_INDEX: Record<Language, string[]> = {
  js: [
    'function maxIndex(nums) {',
    '  let best = 0;',
    '  for (let i = 1; i < nums.length; i++) {',
    '    if (nums[i] > nums[best]) {',
    '      best = i;',
    '    }',
    '  }',
    '  return best;',
    '}',
  ],
  go: [
    'func maxIndex(nums []int) int {',
    '\tbest := 0',
    '\tfor i := 1; i < len(nums); i++ {',
    '\t\tif nums[i] > nums[best] {',
    '\t\t\tbest = i',
    '\t\t}',
    '\t}',
    '\treturn best',
    '}',
  ],
  java: [
    'static int maxIndex(int[] nums) {',
    '    int best = 0;',
    '    for (int i = 1; i < nums.length; i++) {',
    '        if (nums[i] > nums[best]) {',
    '            best = i;',
    '        }',
    '    }',
    '    return best;',
    '}',
  ],
};

const GOLDEN_DRAINS: Record<Language, string[]> = {
  js: [
    'function drains(nums, k) {',
    '  let found = false;',
    '  let rest = k;',
    '  let i = nums.length - 1;',
    '  while (i >= 0 && found === false) {',
    '    if (nums[i] % 2 !== 0 || nums[i] < (-1)) {',
    '      rest -= nums[i];',
    '    }',
    '    if (rest < 0) {',
    '      found = true;',
    '    }',
    '    i -= 1;',
    '  }',
    '  return found;',
    '}',
  ],
  go: [
    'func drains(nums []int, k int) bool {',
    '\tfound := false',
    '\trest := k',
    '\ti := len(nums) - 1',
    '\tfor i >= 0 && found == false {',
    '\t\tif nums[i] % 2 != 0 || nums[i] < (-1) {',
    '\t\t\trest -= nums[i]',
    '\t\t}',
    '\t\tif rest < 0 {',
    '\t\t\tfound = true',
    '\t\t}',
    '\t\ti -= 1',
    '\t}',
    '\treturn found',
    '}',
  ],
  java: [
    'static boolean drains(int[] nums, int k) {',
    '    boolean found = false;',
    '    int rest = k;',
    '    int i = nums.length - 1;',
    '    while (i >= 0 && found == false) {',
    '        if (nums[i] % 2 != 0 || nums[i] < (-1)) {',
    '            rest -= nums[i];',
    '        }',
    '        if (rest < 0) {',
    '            found = true;',
    '        }',
    '        i -= 1;',
    '    }',
    '    return found;',
    '}',
  ],
};

describe('typed emit', () => {
  it('matches the maxIndex goldens (S-047 TS-7)', () => {
    for (const lang of LANGUAGES) {
      expect(emit(maxIndex().tree, lang).code).toBe(GOLDEN_MAX_INDEX[lang].join('\n'));
    }
  });

  it('matches the drains goldens (S-047 TS-8)', () => {
    for (const lang of LANGUAGES) {
      expect(emit(drains().tree, lang).code).toBe(GOLDEN_DRAINS[lang].join('\n'));
    }
  });

  it('prints the safe form of every operator combination (S-047 TS-9)', () => {
    type Case = [string, (b: ReturnType<typeof createTreeBuilder>) => Expr, string, string?];
    const v = (b: ReturnType<typeof createTreeBuilder>, n: string) => b.var(n);
    const cases: Case[] = [
      ['a', (b) => b.bin('-', v(b, 'a'), b.num(-1)), 'a - (-1)'],
      ['b', (b) => b.bin('+', b.num(-1), v(b, 'a')), '-1 + a'],
      [
        'c',
        (b) => b.bin('==', b.bin('<', v(b, 'a'), v(b, 'b')), b.bool(true)),
        '(a < b) == true',
        '(a < b) === true',
      ],
      [
        'd',
        (b) => b.bin('!=', v(b, 'a'), b.bin('<', v(b, 'b'), v(b, 'c'))),
        'a != (b < c)',
        'a !== (b < c)',
      ],
      [
        'e',
        (b) => b.bin('&&', b.bin('||', v(b, 'p'), v(b, 'q')), b.bin('<', v(b, 'a'), v(b, 'b'))),
        '(p || q) && a < b',
      ],
      ['f', (b) => b.bin('||', b.bin('&&', v(b, 'p'), v(b, 'q')), v(b, 'p')), 'p && q || p'],
      ['g', (b) => b.bin('&&', v(b, 'p'), b.bin('&&', v(b, 'q'), v(b, 'p'))), 'p && (q && p)'],
      ['h', (b) => b.bin('%', b.bin('*', v(b, 'a'), v(b, 'b')), b.num(3)), 'a * b % 3'],
      ['i', (b) => b.bin('*', v(b, 'a'), b.bin('%', v(b, 'b'), b.num(3))), 'a * (b % 3)'],
      ['j', (b) => b.bin('%', b.bin('+', v(b, 'a'), v(b, 'b')), b.num(2)), '(a + b) % 2'],
      ['k', (b) => b.bin('<', v(b, 'x'), b.len(v(b, 'a'))), 'x < len(a)', 'x < a.length'],
      [
        'l',
        (b) => b.index(v(b, 'a'), b.bin('-', b.len(v(b, 'a')), b.num(1))),
        'a[len(a) - 1]',
        'a[a.length - 1]',
      ],
      ['m', (b) => b.half(b.num(-3)), '-3 / 2', 'Math.trunc(-3 / 2)'],
    ];
    for (const [name, make, goJava, js] of cases) {
      const b = createTreeBuilder();
      const f = b.func('f', ['a', 'b', 'c', 'x', 'p', 'q'], [b.return(make(b))]);
      const line = (lang: Language) => emit(f, lang).code.split('\n')[1];
      const expectedGo = goJava;
      const expectedJs = js ?? goJava.replace('len(a)', 'a.length');
      const expectedJava = goJava.replace('len(a)', 'a.length');
      expect(line('js'), name).toBe(`  return ${expectedJs};`);
      expect(line('go'), name).toBe(`\treturn ${expectedGo}`);
      expect(line('java'), name).toBe(`    return ${expectedJava};`);
    }
  });

  it('lists the statement lines (S-047 TS-11)', () => {
    const expected: [
      ReturnType<typeof emit>['statementLines'],
      ReturnType<typeof maxIndex>['tree'],
    ][] = [
      [[2, 3, 4, 5, 8], maxIndex().tree],
      [[2, 3, 4, 5, 6, 7, 9, 10, 12, 14], drains().tree],
      [[2, 3, 4, 5, 6, 7, 9, 10, 13], treeA().tree],
      [[2], treeE()],
    ];
    for (const [lines, tree] of expected) {
      for (const lang of LANGUAGES) {
        const result = emit(tree, lang);
        expect(result.statementLines).toEqual(lines);
        const texts = result.code.split('\n');
        for (const line of result.statementLines) {
          expect(line).toBeGreaterThan(1);
          expect(texts[line - 1]?.trim()).not.toBe('}');
        }
      }
    }
  });
});
