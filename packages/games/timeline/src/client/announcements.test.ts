import type { Active, Over } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';

import { makeAnnouncements, makeScreenReaderInstructions } from './announcements';
import { INITIAL_ORDER, PUBLIC_VIEW_ES } from './test-fixtures';
import { makeT } from './test-utils';

const labels = new Map(PUBLIC_VIEW_ES.items.map((i) => [i.opaque_id, i.label]));
const build = (locale: 'es' | 'en') =>
  makeAnnouncements(
    makeT(locale),
    (id) => labels.get(id) ?? id,
    (id) => INITIAL_ORDER.indexOf(id) + 1,
  );
const active = { id: 'p7k2m9' } as unknown as Active;
const over = { id: 'k1v3s8' } as unknown as Over;

describe('makeAnnouncements (TS-25)', () => {
  it('announces in es', () => {
    const a = build('es');
    expect(a.onDragStart?.({ active })).toBe('Tomaste Python, posición 3 de 5.');
    expect(a.onDragOver?.({ active, over })).toBe('Python, posición 2 de 5.');
    expect(a.onDragEnd?.({ active, over })).toBe('Soltaste Python en la posición 2 de 5.');
    expect(a.onDragCancel?.({ active, over: null })).toBe('Python volvió a la posición 3 de 5.');
  });

  it('announces in en', () => {
    const a = build('en');
    expect(a.onDragStart?.({ active })).toBe('Picked up Python, position 3 of 5.');
  });

  it('uses the original position when there is no target', () => {
    const a = build('es');
    const ev = { active, over: null };
    expect(a.onDragOver?.(ev)).toBe('Python, posición 3 de 5.');
    expect(a.onDragEnd?.(ev)).toBe('Soltaste Python en la posición 3 de 5.');
  });

  it('builds the screen reader instructions', () => {
    expect(makeScreenReaderInstructions(makeT('es')).draggable).toMatch(/Espacio o Enter/);
  });
});
