import { describe, expect, it } from 'vitest';
import { emit } from '../../src/emit/index';
import { LANGUAGES } from '../../src/emit/languages';
import { evaluate } from '../../src/tree/evaluate';
import { checkPortable } from '../../src/tree/portable';
import { replaceNode } from '../../src/tree/replace';
import { maxIndex, rem } from '../fixtures/trees';

describe('replaceNode', () => {
  it('replaces an expression keeping the other ids (S-047 TS-22)', () => {
    const tree = maxIndex().tree;
    const before = JSON.stringify(tree);
    const m = replaceNode(tree, 'n16', (node, b) =>
      node.kind === 'bin' ? b.bin('>=', node.left, node.right) : node,
    );
    expect(JSON.stringify(tree)).toBe(before);
    const original = emit(tree, 'js').code.split('\n');
    const mutated = emit(m, 'js').code.split('\n');
    expect(original[3]).toBe('    if (nums[i] > nums[best]) {');
    expect(mutated[3]).toBe('    if (nums[i] >= nums[best]) {');
    expect(mutated.filter((_, i) => i !== 3)).toEqual(original.filter((_, i) => i !== 3));
    for (const lang of LANGUAGES) {
      const result = emit(m, lang);
      expect(result.lineOf['n24']).toBe(4);
      expect(result.lineOf['n12']).toBe(4);
      expect(result.lineOf['n15']).toBe(4);
      expect(Object.keys(result.lineOf)).toHaveLength(Object.keys(emit(tree, lang).lineOf).length);
    }
    const ids = (t: typeof tree) => Object.keys(emit(t, 'js').lineOf).sort();
    expect(ids(m)).toEqual([...ids(tree).filter((id) => id !== 'n16'), 'n24'].sort());
    expect(evaluate(m, [[5, 1, 5]])).toEqual({ ok: true, value: 2 });
  });

  it('replaces a statement (S-047 TS-23)', () => {
    const tree = maxIndex().tree;
    const r = replaceNode(tree, 'n18', (_n, b) => b.return(b.var('i')));
    expect(emit(r, 'js').code.split('\n')[4]).toBe('      return i;');
    expect(emit(r, 'go').code.split('\n')[4]).toBe('\t\t\treturn i');
    expect(emit(r, 'java').code.split('\n')[4]).toBe('            return i;');
    for (const lang of LANGUAGES) {
      const result = emit(r, lang);
      expect(result.code.split('\n')).toHaveLength(9);
      expect(result.lineOf['n24']).toBe(5);
      expect(result.lineOf['n25']).toBe(5);
      expect(result.statementLines).toEqual([2, 3, 4, 5, 8]);
    }
    expect(checkPortable(r)).toEqual([]);
    expect(evaluate(r, [[3, 7, 2]])).toEqual({ ok: true, value: 1 });
  });

  it('rejects invalid replacements without touching the tree (S-047 TS-24)', () => {
    const tree = maxIndex().tree;
    const before = JSON.stringify(tree);
    expect(() => replaceNode(tree, 'n99', (n) => n)).toThrow(new Error('node_not_found: n99'));
    expect(() => replaceNode(tree, 'n18', (_n, b) => b.num(1))).toThrow(
      new Error('replace_kind_mismatch: n18'),
    );
    expect(() => replaceNode(tree, 'n4', (_n, b) => b.inc('i'))).toThrow(
      new Error('replace_kind_mismatch: n4'),
    );
    expect(() => replaceNode(tree, 'n9', (_n, b) => b.return(b.num(1)))).toThrow(
      new Error('replace_kind_mismatch: n9'),
    );
    expect(() => replaceNode(tree, 'n23', (n) => n)).toThrow(
      new Error('replace_kind_mismatch: n23'),
    );
    expect(JSON.stringify(tree)).toBe(before);

    const r = rem();
    const remBefore = JSON.stringify(r);
    const divisor = (r.body[0] as { expr: { right: { id: `n${number}` } } }).expr.right.id;
    expect(() => replaceNode(r, divisor, (_n, b) => b.num(0))).toThrow(
      new RangeError('invalid_modulo_divisor'),
    );
    expect(JSON.stringify(r)).toBe(remBefore);
  });

  it('rejects ids that end up repeated', () => {
    const tree = maxIndex().tree;
    expect(() => replaceNode(tree, 'n18', (n) => ({ ...n, id: 'n17' }))).toThrow(
      new Error('duplicate_node_id: n17'),
    );
  });
});
