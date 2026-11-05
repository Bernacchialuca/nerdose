import { render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import i18n from '@/i18n';
import { todayFixture } from '@/test/fixtures/today';

import { deriveHomeView } from '../home-view';
import type { CardView } from '../home-view';
import { GameCard } from './game-card';

function cardOf(id: string): CardView {
  const view = deriveHomeView({
    today: todayFixture,
    isPending: false,
    isError: false,
    sessionStatus: 'active',
  });
  if (view.kind !== 'ready') throw new Error('not ready');
  return view.cards.find((c) => c.game_id === id) as CardView;
}

function renderCard(id: Parameters<typeof GameCard>[0]['gameId'], view: CardView) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ul>
          <li>
            <GameCard gameId={id} view={view} />
          </li>
        </ul>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('GameCard', () => {
  it('devdle completado: label, racha y link a resultado', async () => {
    const { container } = renderCard('devdle', cardOf('devdle'));
    const card = screen.getByRole('article', { name: 'Devdle' });
    expect(card).toHaveTextContent('✓ 4/6');
    expect(card).toHaveTextContent('racha 5');
    expect(within(card).getByRole('link', { name: 'Ver resultado' })).toHaveAttribute(
      'href',
      '/devdle',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('grep-grid en curso, sin tiempo', () => {
    renderCard('grep-grid', cardOf('grep-grid'));
    const card = screen.getByRole('article', { name: 'Grep Grid' });
    expect(card).toHaveTextContent('en curso');
    expect(card).toHaveTextContent('sin tiempo');
    expect(within(card).getByRole('link', { name: 'Seguir jugando' })).toHaveAttribute(
      'href',
      '/grep-grid',
    );
  });

  it('timeline sin jugar: Jugar', () => {
    renderCard('timeline', cardOf('timeline'));
    expect(screen.getByRole('link', { name: 'Jugar' })).toHaveAttribute('href', '/timeline');
  });

  it('big-o sin desafío: botón deshabilitado alcanzable', () => {
    renderCard('big-o', cardOf('big-o'));
    expect(screen.getByRole('article')).toHaveTextContent('sin desafío hoy · no afecta tu racha');
    expect(screen.getByRole('button', { name: 'Sin desafío hoy' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('bug-hunt anulado: sin link ni botón', () => {
    renderCard('bug-hunt', cardOf('bug-hunt'));
    expect(screen.getByRole('article')).toHaveTextContent('anulado');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('vista de error: sin estado, racha ni CTA', () => {
    renderCard('devdle', { game_id: 'devdle', status: null, label: null, streak: null, cta: null });
    const card = screen.getByRole('article');
    expect(card).toHaveTextContent('Adiviná el término tech en 6 intentos');
    expect(card).toHaveTextContent('~2 min');
    expect(card).not.toHaveTextContent('racha');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
