// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEnv } from './env';

describe('parseEnv', () => {
  it('TS-4: sin variables queda todo apagado', () => {
    expect(parseEnv({})).toEqual({
      VITE_PLAUSIBLE_DOMAIN: undefined,
      VITE_PLAUSIBLE_SCRIPT_URL: undefined,
    });
    expect(parseEnv({ VITE_PLAUSIBLE_DOMAIN: '' }).VITE_PLAUSIBLE_DOMAIN).toBeUndefined();
  });

  it('TS-4: con dominio la URL del script es obligatoria', () => {
    expect(() => parseEnv({ VITE_PLAUSIBLE_DOMAIN: 'nerdose.dev' })).toThrow(ZodError);
  });

  it('TS-4: con dominio y URL devuelve ambos', () => {
    const raw = {
      VITE_PLAUSIBLE_DOMAIN: 'nerdose.dev',
      VITE_PLAUSIBLE_SCRIPT_URL: 'https://plausible.nerdose.dev/js/script.js',
    };
    expect(parseEnv(raw)).toEqual(raw);
  });
});
