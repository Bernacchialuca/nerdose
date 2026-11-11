import { ERROR_CATALOG, LOCALES, type ErrorCode } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { errorMessage } from '@/http/error-messages';

describe('errorMessage', () => {
  const codes = Object.keys(ERROR_CATALOG) as ErrorCode[];

  it('cubre todo el catálogo en los dos idiomas con textos distintos', () => {
    expect(codes).toHaveLength(22);
    for (const code of codes) {
      for (const locale of LOCALES) expect(errorMessage(code, locale)).not.toBe('');
      expect(errorMessage(code, 'es')).not.toBe(errorMessage(code, 'en'));
    }
  });

  it('tiene los textos de invalid_culprit', () => {
    expect(errorMessage('invalid_culprit', 'es')).toBe('El culpable no pertenece al desafío.');
    expect(errorMessage('invalid_culprit', 'en')).toBe(
      'The culprit does not belong to the challenge.',
    );
  });

  it('no cambia los textos en español', () => {
    expect(errorMessage('rate_limited', 'es')).toBe('Demasiadas solicitudes.');
    expect(errorMessage('not_found', 'es')).toBe('Recurso no encontrado.');
  });
});
