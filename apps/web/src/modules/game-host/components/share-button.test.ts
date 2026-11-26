import { describe, expect, it } from 'vitest';

import { withSite } from './share-button';

describe('withSite', () => {
  it('agrega el host recibido como última línea', () => {
    expect(withSite('🔎 Grep Grid #8\n8/8', 'nerdose.example')).toBe(
      '🔎 Grep Grid #8\n8/8\nnerdose.example',
    );
  });

  it('por defecto usa el host de la dirección abierta, sin dominio fijo', () => {
    expect(withSite('🧮 Big O #8\n🟩 Go')).toBe(`🧮 Big O #8\n🟩 Go\n${window.location.host}`);
    expect(window.location.host).toBe('localhost:5173');
  });
});
