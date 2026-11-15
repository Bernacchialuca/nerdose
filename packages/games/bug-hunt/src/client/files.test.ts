import { describe, expect, it } from 'vitest';

import { fileNames } from './files';

describe('fileNames (TS-11)', () => {
  it('follows each language convention', () => {
    expect(fileNames('maxIndex')).toEqual({
      js: 'max-index.js',
      go: 'max_index.go',
      java: 'MaxIndex.java',
    });
    expect(fileNames('countEqualNeighbors')).toEqual({
      js: 'count-equal-neighbors.js',
      go: 'count_equal_neighbors.go',
      java: 'CountEqualNeighbors.java',
    });
    expect(fileNames('isPalindrome')).toEqual({
      js: 'is-palindrome.js',
      go: 'is_palindrome.go',
      java: 'IsPalindrome.java',
    });
  });
});
