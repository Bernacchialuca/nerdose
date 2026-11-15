import { describe, expect, it } from 'vitest';
import { signatureOf } from '../../src/tree/signature';
import { drains, treeA } from '../fixtures/trees';

describe('signatureOf', () => {
  it('fills int in untyped trees', () => {
    expect(signatureOf(treeA().tree)).toEqual({ params: ['int'], returns: 'int' });
  });

  it('reads typed trees', () => {
    expect(signatureOf(drains().tree)).toEqual({ params: ['int[]', 'int'], returns: 'bool' });
  });
});
