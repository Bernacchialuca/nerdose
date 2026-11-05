import { ERROR_CATALOG, LOCALES, type ErrorCode } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { errorMessage } from '@/http/error-messages';

describe('errorMessage', () => {
  const codes = Object.keys(ERROR_CATALOG) as ErrorCode[];

  it('cubre todo el catálogo en los dos idiomas con textos distintos', () => {
    expect(codes).toHaveLength(21);
    for (const code of codes) {
      for (const locale of LOCALES) expect(errorMessage(code, locale)).not.toBe('');
      expect(errorMessage(code, 'es')).not.toBe(errorMessage(code, 'en'));
    }
  });

  it('no cambia los textos en español', () => {
    expect(errorMessage('rate_limited', 'es')).toBe('Demasiadas solicitudes.');
    expect(errorMessage('not_found', 'es')).toBe('Recurso no encontrado.');
  });
});
