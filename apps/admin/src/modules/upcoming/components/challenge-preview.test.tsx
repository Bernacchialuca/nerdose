import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { BUG_HUNT_PAYLOAD } from '@/test/fixtures/upcoming';

import { ChallengePreview } from './challenge-preview';

vi.mock('../registry', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../registry')>()),
  hasPreview: () => false,
}));

describe('ChallengePreview sin Preview registrada (TS-7)', () => {
  it('cae a la vista genérica del payload sin aviso', async () => {
    const { container } = render(
      <ChallengePreview gameId="bug-hunt" payload={{ ...BUG_HUNT_PAYLOAD, date: '2026-12-02' }} />,
    );
    expect(within(screen.getByRole('region', { name: 'ES' })).getAllByText('spec')).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'ES' })).toHaveTextContent(
      'Devuelve el índice del mayor valor de nums; si el máximo se repite, el del primero. Con nums vacío devuelve 0.',
    );
    expect(screen.getByRole('region', { name: 'EN' })).toHaveTextContent(
      'Returns the index of the largest value in nums;',
    );
    expect(screen.queryByText(/No pudimos mostrar la preview/)).toBeNull();
    expect(screen.queryByText('Cargando preview…')).toBeNull();
    expect(container.querySelector('[lang]')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});
