// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';

import { Instructions } from './instructions';
import { makeT } from './test-utils';
import type { InstructionsProps } from './types';

const base = (over: Partial<InstructionsProps> = {}): InstructionsProps => ({
  number: 128,
  locale: 'es',
  t: makeT('es'),
  onStart: vi.fn(),
  ...over,
});

describe('Instructions', () => {
  it('shows the content (TS-43)', () => {
    render(<Instructions {...base()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Devdle' })).toHaveClass('text-game-devdle');
    expect(screen.getByText('Desafío #128 · ~2 min · una partida por día')).toBeInTheDocument();
    const h2 = screen.getByRole('heading', { level: 2, name: /cómo se juega/ });
    expect(h2.closest('section')).toHaveAttribute('id', 'game-help');
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(3);
    expect(articles[0]).toHaveTextContent('1 · Adiviná el término');
    expect(articles[1]).toHaveTextContent('2 · Leé las pistas');
    expect(articles[2]).toHaveTextContent('3 · Mirá las categorías');
    expect(articles[0]).toHaveTextContent('de 4 a 12 letras');
    expect(articles[2]).toHaveTextContent('8 categorías');
    expect(
      screen.getByText('La partida no cuenta hasta que la completes. Ganar o perder suma a tu racha.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
  });

  it('starts only once (TS-44) and re-arms after a failure (TS-45)', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const props = base({ onStart });
    const { rerender } = render(<Instructions {...props} />);
    const btn = screen.getByRole('button', { name: /Empezar/ });
    await user.dblClick(btn);
    expect(onStart).toHaveBeenCalledTimes(1);
    rerender(<Instructions {...props} starting />);
    rerender(<Instructions {...props} starting={false} />);
    await user.click(screen.getByRole('button', { name: /Empezar/ }));
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it('is neutral and inert while starting or without session (TS-46)', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const { rerender } = render(<Instructions {...base({ onStart, starting: true })} />);
    let btn = screen.getByRole('button', { name: /Empezar/ });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    await user.click(btn);
    rerender(<Instructions {...base({ onStart, startDisabled: true })} />);
    btn = screen.getByRole('button', { name: /Empezar/ });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    await user.click(btn);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('renders slots in position (TS-47) and layout (TS-48)', () => {
    const { container } = render(
      <Instructions {...base({ notices: <p>día nuevo</p>, actions: <a href="/">Volver</a> })} />,
    );
    const meta = screen.getByText(/Desafío #128/);
    const notice = screen.getByText('día nuevo');
    const h2 = screen.getByRole('heading', { level: 2 });
    expect(meta.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(notice.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const row = screen.getByRole('button', { name: /Empezar/ }).parentElement as HTMLElement;
    expect(within(row).getByRole('link', { name: 'Volver' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('mx-auto', 'max-w-5xl');
    expect(screen.getByRole('list')).toHaveClass('grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))]');
    expect(row.parentElement).toHaveClass('flex', 'flex-wrap', 'justify-between');
  });

  it('has no axe violations in es and en (TS-49)', async () => {
    const es = render(<Instructions {...base()} />);
    expect(await axe(es.container)).toHaveNoViolations();
    es.unmount();
    const en = render(<Instructions {...base({ locale: 'en', t: makeT('en') })} />);
    expect(await axe(en.container)).toHaveNoViolations();
    expect(screen.getByRole('button', { name: /Start/ })).toBeInTheDocument();
    expect(screen.getByText('Challenge #128 · ~2 min · one game per day')).toBeInTheDocument();
  });
});
