import { describe, expect, it } from 'vitest';

import { voidSummary } from './void-summary';

describe('voidSummary', () => {
  it('sin culpable elegido omite la frase del culpable', () => {
    const { text, footnote } = voidSummary('Devdle #8', null);
    expect(text).toContain('Esto no se puede deshacer. Devdle #8 deja de aceptar jugadas');
    expect(text).not.toContain('rechazado');
    expect(text).not.toContain('Ningún');
    expect(footnote).toBeUndefined();
  });

  it('término: nombra el ítem y avisa de los desafíos ya generados', () => {
    const { text, footnote } = voidSummary('Devdle #8', { kind: 'term', label: 'REDIS' });
    expect(text).toContain('El término REDIS queda rechazado y no vuelve a usarse.');
    expect(footnote).toBe(
      'Los desafíos ya generados de los próximos días que usen REDIS no cambian.',
    );
  });

  it('hecho: usa comillas angulares', () => {
    const { text, footnote } = voidSummary('Tech Timeline #7', {
      kind: 'timeline_fact',
      label: 'Lanzamiento de Docker',
    });
    expect(text).toContain(
      'El hecho «Lanzamiento de Docker» queda rechazado y no vuelve a usarse.',
    );
    expect(footnote).toContain('«Lanzamiento de Docker»');
  });

  it.each(['template', 'none'] as const)('%s: ningún ítem cambia de estado', (kind) => {
    const { text, footnote } = voidSummary('Devdle #8', { kind });
    expect(text).toContain('Ningún término ni hecho cambia de estado.');
    expect(footnote).toBeUndefined();
  });
});
