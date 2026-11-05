import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDocumentTitle } from './use-document-title';

describe('useDocumentTitle', () => {
  it('setea y actualiza document.title', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'uno' },
    });
    expect(document.title).toBe('uno');
    rerender({ title: 'dos' });
    expect(document.title).toBe('dos');
  });
});
