import { describe, expect, it } from 'vitest';
import { classifyFailure } from '../../src/runner/outcome';

describe('classifyFailure (TS-24)', () => {
  it('classifies each failure', () => {
    expect(classifyFailure('js', 'run', { code: 'ENOENT' }, '')).toBe('toolchain_missing');
    expect(
      classifyFailure(
        'js',
        'run',
        { code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER', killed: true, signal: 'SIGKILL' },
        '',
      ),
    ).toBe('output_too_large');
    expect(
      classifyFailure('java', 'run', { killed: true, signal: 'SIGKILL', code: null as never }, ''),
    ).toBe('timeout');
    expect(
      classifyFailure(
        'go',
        'build',
        { code: 1 },
        '# command-line-arguments\n./main.go:3:2: declared and not used: x',
      ),
    ).toBe('compile_error');
    expect(
      classifyFailure(
        'java',
        'run',
        { code: 1 },
        "Main.java:3: error: ';' expected\n1 error\nerror: compilation failed",
      ),
    ).toBe('compile_error');
    expect(
      classifyFailure('js', 'run', { code: 1 }, "main.js:2\n\nSyntaxError: Unexpected token ';'"),
    ).toBe('compile_error');
    expect(classifyFailure('go', 'run', { code: 2 }, 'panic: boom')).toBe('runtime_error');
    expect(
      classifyFailure(
        'java',
        'run',
        { code: 1 },
        'Exception in thread "main" java.lang.RuntimeException: boom',
      ),
    ).toBe('runtime_error');
  });
});
