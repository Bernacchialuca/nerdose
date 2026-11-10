import { describe, expect, it } from 'vitest';

import { buildWordList, serializeWordList } from '../scripts/build-wordlist/words';

describe('word list building', () => {
  it('filters and unites sources (TS-51)', () => {
    expect(
      buildWordList('aardvark\nabc\nReact\r\ncache\nzyzzyvas\nco-op\nantidisestablishment\n\n', [
        'Linux',
        'PostgreSQL',
        'C++',
        'Go',
        'React',
        'Kubernetes',
        'Node.js',
        'Rust',
        'Álgebra',
      ]),
    ).toEqual([
      'AARDVARK',
      'CACHE',
      'KUBERNETES',
      'LINUX',
      'POSTGRESQL',
      'REACT',
      'RUST',
      'ZYZZYVAS',
    ]);
  });

  it('adds curated extras that the sources miss', () => {
    expect(buildWordList('cache\n', ['Rust'], ['linux', '# comentario', 'vim', 'Unix'])).toEqual([
      'CACHE',
      'LINUX',
      'RUST',
      'UNIX',
    ]);
  });

  it('serializes one word per line with a trailing newline (TS-52)', () => {
    expect(serializeWordList(['CACHE', 'REACT'])).toBe('CACHE\nREACT\n');
  });
});
