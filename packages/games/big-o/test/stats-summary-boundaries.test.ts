/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const clientDir = fileURLToPath(new URL('../src/client/', import.meta.url));
const srcDir = fileURLToPath(new URL('../src/', import.meta.url));

const DENYLIST = ['game', 'code-block', 'highlight', 'use-tokenizer', 'options-group'];

const resolveFile = (from: string, spec: string): string | null => {
  const base = join(dirname(from), spec);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
};

const graph = () => {
  const visited = new Map<string, string>();
  const externals = new Set<string>();
  const queue = [join(clientDir, 'stats-summary.tsx')];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (visited.has(file)) continue;
    const text = readFileSync(file, 'utf8');
    visited.set(file, text);
    for (const m of text.matchAll(/from\s+'([^']+)'/g)) {
      const spec = m[1] as string;
      if (!spec.startsWith('.')) {
        externals.add(spec);
        continue;
      }
      const resolved = resolveFile(file, spec);
      if (resolved) queue.push(resolved);
    }
  }
  return { visited, externals };
};

describe('StatsSummary import graph (TS-28)', () => {
  it('does not reach the board, Shiki or dnd-kit', () => {
    const { visited, externals } = graph();
    expect(visited.size).toBeGreaterThan(1);
    for (const file of visited.keys()) {
      const name = file
        .slice(srcDir.length)
        .replace(/\.tsx?$/, '')
        .split('/')
        .pop() as string;
      expect(DENYLIST, `${file} is part of the board`).not.toContain(name);
    }
    for (const spec of externals) {
      expect(spec.startsWith('@dnd-kit'), spec).toBe(false);
      expect(spec.startsWith('shiki'), spec).toBe(false);
    }
  });

  it('has no network, storage nor clock access', () => {
    for (const [file, text] of graph().visited) {
      for (const forbidden of ['fetch(', 'localStorage', 'Date.now(', 'new Date()']) {
        expect(text.includes(forbidden), `${file} contains ${forbidden}`).toBe(false);
      }
    }
  });
});
