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
  it('shows the content (TS-27)', () => {
    render(<Instructions {...base()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Big O' })).toHaveClass('text-game-big-o');
    expect(screen.getByText('Desafío #8 · ~1 min · una partida por día')).toBeInTheDocument();
    const h2 = screen.getByRole('heading', { level: 2, name: /cómo se juega/ });
    expect(h2.closest('section')).toHaveAttribute('id', 'game-help');
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(3);
    expect(articles[0]).toHaveTextContent('1 · Leé el código');
    expect(articles[1]).toHaveTextContent('2 · Pensá en el peor caso');
    expect(articles[2]).toHaveTextContent('3 · Elegí y confirmá');
    expect(articles[0]).toHaveTextContent(
      'Es una función f(n) que cuenta sus propias operaciones.',
    );
    expect(articles[1]).toHaveTextContent('¿Cómo crece la cantidad de operaciones cuando n crece?');
    expect(articles[2]).toHaveTextContent('Hay 8 opciones, de O(1) a O(n!), y un solo intento.');
    expect(
      screen.getByText(
        'La partida no cuenta hasta que confirmes. Si salís antes, al volver no vas a tener ninguna opción marcada, pero conservás tu intento.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
    expect(screen.queryByText(/loops|recursión|nested/)).not.toBeInTheDocument();
    expect(screen.queryByText(/function f/)).not.toBeInTheDocument();
  });

  it('starts only once (TS-28) and re-arms', async () => {
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

  it('is inert while starting or without session (TS-29)', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const { rerender } = render(<Instructions {...base({ onStart, starting: true })} />);
    const button = screen.getByRole('button', { name: /Empezar/ });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await user.click(button);
    rerender(<Instructions {...base({ onStart, startDisabled: true })} />);
    await user.click(screen.getByRole('button', { name: /Empezar/ }));
    expect(screen.getByRole('button', { name: /Empezar/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    screen.getByRole('button', { name: /Empezar/ }).focus();
    expect(screen.getByRole('button', { name: /Empezar/ })).toHaveFocus();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('renders the slots and English texts (TS-30)', () => {
    render(
      <Instructions
        {...base({
          locale: 'en',
          t: makeT('en'),
          notices: <p>aviso host</p>,
          actions: <a href="/">volver</a>,
        })}
      />,
    );
    expect(screen.getByText('Challenge #8 · ~1 min · one game per day')).toBeInTheDocument();
    const notice = screen.getByText('aviso host');
    expect(screen.getByRole('heading', { level: 1, name: 'Big O' })).toBeInTheDocument();
    const rules = screen.getByRole('heading', { level: 2, name: /how to play/ });
    expect(screen.getByText('1 · Read the code')).toBeInTheDocument();
    expect(notice.compareDocumentPosition(rules) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const start = screen.getByRole('button', { name: /Start/ });
    expect(
      start.compareDocumentPosition(screen.getByText('volver')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it.each(['es', 'en'] as const)('has no axe violations in %s', async (locale) => {
    const { container } = render(<Instructions {...base({ locale, t: makeT(locale) })} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
