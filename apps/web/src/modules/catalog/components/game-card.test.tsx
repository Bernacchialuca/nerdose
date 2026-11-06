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
    const card = screen.getByRole('article');
    expect(card).toHaveTextContent('sin desafío hoy');
    expect(card).toHaveTextContent('no afecta tu racha');
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
    renderCard('devdle', {
      game_id: 'devdle',
      status: null,
      label: null,
      streak: null,
      cta: null,
      next: false,
    });
    const card = screen.getByRole('article');
    expect(card).toHaveTextContent('Adiviná el término tech en 6 intentos');
    expect(card).toHaveTextContent('~2 min');
    expect(card).not.toHaveTextContent('racha');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('TS-20/22: anatomía, h3, badge y miniatura aria-hidden', () => {
    renderCard('devdle', {
      ...cardOf('devdle'),
      status: 'notPlayed',
      label: null,
      cta: { kind: 'link', to: '/devdle', label: 'play', tone: 'primary' },
    });
    const card = screen.getByRole('article', { name: 'Devdle' });
    const heading = within(card).getByRole('heading', { level: 3, name: 'Devdle' });
    expect(heading).toHaveClass('font-mono', 'text-title-card', 'text-game-devdle');
    expect(card).toHaveAttribute('aria-labelledby', heading.id);
    expect(within(card).getByText('sin jugar')).toHaveClass('bg-status-pending-badge');
    const thumb = card.firstElementChild as HTMLElement;
    expect(thumb).toHaveAttribute('aria-hidden', 'true');
    expect(thumb).toHaveClass('h-37.5', 'bg-game-devdle-tint');
    const link = within(card).getByRole('link', { name: /^Jugar/ });
    expect(link).toHaveClass('bg-game-devdle', 'text-game-devdle-on', 'min-h-11', 'w-full');
    expect(link.querySelector('span[aria-hidden="true"]')).toHaveTextContent('→');
    const items = within(within(card).getByRole('list')).getAllByRole('listitem');
    expect(items.map((i) => i.textContent)).toEqual(['~2 min', '▲ racha 5']);
    expect(items[1]).toHaveClass('text-streak');
    expect(items[1]!.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
  });

  it('TS-21: tarjeta resuelta con badge de éxito y CTA secundario', () => {
    renderCard('devdle', cardOf('devdle'));
    const card = screen.getByRole('article', { name: 'Devdle' });
    expect(within(card).getByText('✓ 4/6')).toHaveClass(
      'bg-status-success-badge',
      'text-status-success-badge-text',
    );
    const link = within(card).getByRole('link', { name: 'Ver resultado' });
    expect(link).toHaveClass('border-border-strong', 'font-medium', 'w-full');
    expect(link.className).not.toMatch(/bg-game-/);
  });

  it('TS-23: racha 0 en gris, sin triángulo', () => {
    renderCard('timeline', cardOf('timeline'));
    const card = screen.getByRole('article', { name: 'Tech Timeline' });
    const streak = within(card).getByText('racha 0');
    expect(streak).not.toHaveClass('text-streak');
    expect(streak.textContent).not.toContain('▲');
  });

  it('TS-24: next marca la tarjeta con borde y sombra del juego', () => {
    renderCard('grep-grid', cardOf('grep-grid'));
    const card = screen.getByRole('article', { name: 'Grep Grid' });
    expect(card).toHaveClass('border-game-grep-grid-featured', 'shadow-next-grep-grid');
    expect(within(card).getByText('en curso')).toHaveClass('bg-status-pending-badge');
  });

  it('TS-27: anulado con badge neutro', () => {
    renderCard('bug-hunt', cardOf('bug-hunt'));
    expect(screen.getByText('anulado')).toHaveClass('bg-surface-inset');
  });
});
