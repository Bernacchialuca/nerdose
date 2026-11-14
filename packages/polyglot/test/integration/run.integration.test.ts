/// <reference types="node" />
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkToolchains,
  emitProgram,
  parseGoVersion,
  parseJavaMajor,
  parseNodeMajor,
  runInLanguage,
} from '../../src/index';
import { treeA } from '../fixtures/trees';
import { requireToolchains } from './toolchains';

const GO_UNUSED = 'package main\n\nfunc main() {\n\tx := 1\n}\n';
const JAVA_SYNTAX =
  'public class Main {\n    static int f(int n) {\n        return n\n    }\n    public static void main(String[] args) {\n        System.out.println(f(1));\n    }\n}\n';
const GO_PANIC = 'package main\n\nfunc main() {\n\tpanic("boom")\n}\n';
const JAVA_THROW =
  'public class Main {\n    public static void main(String[] args) {\n        throw new RuntimeException("boom");\n    }\n}\n';
const GO_OK = 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println(1)\n}\n';
const JAVA_OK =
  'public class Main {\n    public static void main(String[] args) {\n        System.out.println(1);\n    }\n}\n';

let testTmp = '';
let emptyDir = '';

beforeAll(async () => {
  await requireToolchains();
});
beforeEach(() => {
  testTmp = mkdtempSync(join(tmpdir(), 'polyglot-it-tmp-'));
  emptyDir = mkdtempSync(join(tmpdir(), 'polyglot-it-path-'));
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(testTmp, { recursive: true, force: true });
  rmSync(emptyDir, { recursive: true, force: true });
});

describe('runInLanguage on real toolchains', () => {
  it('reports compile_error in Go, Java and JS (TS-32, TS-33, TS-34)', async () => {
    const go = await runInLanguage('go', GO_UNUSED);
    expect(go).toMatchObject({ ok: false, kind: 'compile_error' });
    expect(!go.ok && go.stderr).toContain('declared and not used: x');

    const java = await runInLanguage('java', JAVA_SYNTAX);
    expect(java).toMatchObject({ ok: false, kind: 'compile_error' });
    expect(!java.ok && java.stderr).toContain('error: compilation failed');

    const js = await runInLanguage('js', 'function f(n) {\n  return n +;\n}\n');
    expect(js).toMatchObject({ ok: false, kind: 'compile_error' });
    expect(!js.ok && js.stderr).toContain('SyntaxError');
  });

  it('reports runtime_error (TS-35)', async () => {
    const outcomes = await Promise.all([
      runInLanguage('js', "throw new Error('boom');"),
      runInLanguage('go', GO_PANIC),
      runInLanguage('java', JAVA_THROW),
    ]);
    for (const outcome of outcomes) {
      expect(outcome).toMatchObject({ ok: false, kind: 'runtime_error' });
      expect(!outcome.ok && outcome.stderr).toContain('boom');
    }
  });

  it('times out without leaving processes behind (TS-36)', async () => {
    vi.stubEnv('TMPDIR', testTmp);
    const js = await runInLanguage('js', 'while (true) {}', { timeoutMs: 1000 });
    const go = await runInLanguage('go', 'package main\n\nfunc main() {\n\tfor {\n\t}\n}\n', {
      timeoutMs: 1000,
    });
    expect(js).toMatchObject({ ok: false, kind: 'timeout' });
    expect(go).toMatchObject({ ok: false, kind: 'timeout' });
    expect(js.durationMs).toBeGreaterThanOrEqual(1000);
    expect(js.durationMs).toBeLessThan(5000);
    expect(go.durationMs).toBeGreaterThanOrEqual(1000);
    expect(go.durationMs).toBeLessThan(5000);
    expect(spawnSync('pgrep', ['-f', testTmp]).status).toBe(1);
  });

  it('reports toolchain_missing with an empty PATH (TS-37)', async () => {
    vi.stubEnv('PATH', emptyDir);
    const cases = [
      ['go', GO_OK, 'go'],
      ['java', JAVA_OK, 'java'],
      ['js', 'console.log(1);', 'node'],
    ] as const;
    for (const [lang, source, binary] of cases) {
      const outcome = await runInLanguage(lang, source);
      expect(outcome).toMatchObject({ ok: false, kind: 'toolchain_missing' });
      expect(!outcome.ok && outcome.stderr).toContain(binary);
    }
  });

  it('reports output_too_large (TS-38)', async () => {
    const outcome = await runInLanguage('js', "process.stdout.write('x'.repeat(2 * 1024 * 1024));");
    expect(outcome).toMatchObject({ ok: false, kind: 'output_too_large' });
  });

  it('leaves no temporary directories behind (TS-39)', async () => {
    vi.stubEnv('TMPDIR', testTmp);
    const calls = [[0], [1], [8], [10]];
    await runInLanguage('js', emitProgram(treeA().tree, 'js', { calls }));
    await runInLanguage('go', GO_UNUSED);
    await runInLanguage('js', "throw new Error('boom');");
    expect(readdirSync(testTmp).filter((e) => e.startsWith('polyglot-'))).toEqual([]);
  });

  it('checkToolchains sees the real toolchains (TS-40)', async () => {
    const report = await checkToolchains();
    expect([report.js.ok, report.go.ok, report.java.ok]).toEqual([true, true, true]);
    expect(parseNodeMajor(report.js.version ?? '')).toBe(24);
    const go = parseGoVersion(report.go.version ?? '');
    expect(go && go.major * 100 + go.minor).toBeGreaterThanOrEqual(125);
    expect(parseJavaMajor(report.java.version ?? '')).toBe(21);
  });
});
