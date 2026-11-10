// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';

import { Instructions } from './instructions';
import { makeT } from './test-utils';
import type { InstructionsProps } from './types';

const base = (over: Partial<InstructionsProps> = {}): InstructionsProps => ({
  number: 8,
  locale: 'es',
  t: makeT('es'),
  onStart: vi.fn(),
  ...over,
});

describe('Instructions', () => {
  it('shows the content (TS-57)', () => {
    render(<Instructions {...base()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Grep Grid' })).toHaveClass(
      'text-game-grep-grid',
    );
    expect(screen.getByText('Desafío #8 · ~3 min · una partida por día')).toBeInTheDocument();
    const h2 = screen.getByRole('heading', { level: 2, name: /cómo se juega/ });
    expect(h2.closest('section')).toHaveAttribute('id', 'game-help');
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(3);
    expect(articles[0]).toHaveTextContent('1 · Buscá las 8 palabras');
    expect(articles[1]).toHaveTextContent('2 · Tocá la primera y la última letra');
    expect(articles[2]).toHaveTextContent('3 · Sin tiempo');
    expect(articles[1]).toHaveTextContent('→ horizontal, ↓ vertical, ↘ y ↗ en diagonal');
    expect(articles[1]).toHaveTextContent('tocar de nuevo el inicio la cancela');
    expect(articles[2]).toHaveTextContent('No hay reloj');
    expect(articles[2]).toHaveTextContent('Podés rendirte');
    expect(
      screen.getByText(
        'La partida no cuenta hasta que la completes. Encontrar las 8 o rendirte suma a tu racha.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
  });

  it('starts only once (TS-58) and re-arms (TS-59)', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const props = base({ onStart });
    const { rerender } = render(<Instructions {...props} />);
    await user.dblClick(screen.getByRole('button', { name: /Empezar/ }));
    expect(onStart).toHaveBeenCalledTimes(1);
    rerender(<Instructions {...props} starting />);
    rerender(<Instructions {...props} starting={false} />);
    await user.click(screen.getByRole('button', { name: /Empezar/ }));
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it('is neutral and inert while starting or without session (TS-60)', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const { rerender } = render(<Instructions {...base({ onStart, starting: true })} />);
    const btn = () => screen.getByRole('button', { name: /Empezar/ });
    expect(btn()).toHaveAttribute('aria-disabled', 'true');
    expect(btn()).toHaveClass('cursor-not-allowed');
    await user.click(btn());
    rerender(<Instructions {...base({ onStart, startDisabled: true })} />);
    expect(btn()).toHaveAttribute('aria-disabled', 'true');
    await user.click(btn());
    expect(onStart).not.toHaveBeenCalled();
  });

  it('renders slots and layout (TS-61)', () => {
    const { container } = render(
      <Instructions {...base({ notices: <p>día nuevo</p>, actions: <a href="/">Volver</a> })} />,
    );
    const notice = screen.getByText('día nuevo');
    const h2 = screen.getByRole('heading', { level: 2 });
    expect(notice.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const row = screen.getByRole('button', { name: /Empezar/ }).parentElement as HTMLElement;
    expect(row).toContainElement(screen.getByText('Volver'));
    expect(container.firstElementChild).toHaveClass('mx-auto', 'max-w-5xl');
    expect(screen.getByRole('list')).toHaveClass(
      'grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))]',
    );
  });

  it('has no axe violations in es and en (TS-62)', async () => {
    const { container, rerender } = render(<Instructions {...base()} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<Instructions {...base({ locale: 'en', t: makeT('en') })} />);
    expect(await axe(container)).toHaveNoViolations();
    expect(screen.getByRole('button', { name: /Start/ })).toBeInTheDocument();
    expect(screen.getByText('Challenge #8 · ~3 min · one game per day')).toBeInTheDocument();
    expect(screen.getByText('1 · Find the 8 words')).toBeInTheDocument();
  });
});
