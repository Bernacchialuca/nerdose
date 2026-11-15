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
  it('shows the content without spoilers (TS-28)', () => {
    const { container } = render(<Instructions {...base()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bug Hunt' })).toHaveClass(
      'text-game-bug-hunt',
    );
    expect(screen.getByText('Desafío #8 · ~2 min · una partida por día')).toBeInTheDocument();
    const h2 = screen.getByRole('heading', { level: 2, name: /cómo se juega/ });
    expect(h2.closest('section')).toHaveAttribute('id', 'game-help');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(3);
    expect(articles[0]).toHaveTextContent('1 · Leé qué debería hacer');
    expect(articles[1]).toHaveTextContent('2 · Buscá la línea');
    expect(articles[2]).toHaveTextContent('3 · Elegí y confirmá');
    expect(articles[0]).toHaveTextContent('Hay un test oculto que falla: el bug está ahí.');
    expect(articles[1]).toHaveTextContent(
      'El bug está en una sola línea. Podés ver el código en JavaScript, Go o Java cuando quieras: es la misma función y el bug está en la misma línea. La firma y las líneas con solo llaves no cuentan.',
    );
    expect(articles[2]).toHaveTextContent(
      'Tenés un solo intento. Al confirmar ves el test que falla, el fix y por qué falla, y el lenguaje con el que confirmaste queda como tu preferido.',
    );
    expect(screen.getByText(/La partida no cuenta hasta que confirmes/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
    for (const leak of ['maxIndex', 'comparación', 'off by one']) {
      expect(container.textContent).not.toContain(leak);
    }
  });

  it('calls onStart once and re-arms (TS-29)', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const { rerender } = render(<Instructions {...base({ onStart })} />);
    const btn = screen.getByRole('button', { name: /Empezar/ });
    await user.click(btn);
    await user.click(btn);
    expect(onStart).toHaveBeenCalledTimes(1);
    rerender(<Instructions {...base({ onStart, starting: true })} />);
    rerender(<Instructions {...base({ onStart, starting: false })} />);
    await user.click(screen.getByRole('button', { name: /Empezar/ }));
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it.each([{ starting: true }, { startDisabled: true }])(
    'is inert with %o (TS-30)',
    async (over) => {
      const user = userEvent.setup();
      const onStart = vi.fn();
      render(<Instructions {...base({ onStart, ...over })} />);
      const btn = screen.getByRole('button', { name: /Empezar/ });
      expect(btn).toHaveAttribute('aria-disabled', 'true');
      await user.click(btn);
      expect(onStart).not.toHaveBeenCalled();
      btn.focus();
      expect(btn).toHaveFocus();
    },
  );

  it('renders slots and English (TS-31)', () => {
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
    const order = [
      screen.getByText('Challenge #8 · ~2 min · one game per day'),
      screen.getByText('aviso host'),
      screen.getByRole('heading', { level: 2 }),
      screen.getByRole('button', { name: /Start/ }),
      screen.getByText('volver'),
    ];
    order.slice(1).forEach((el, i) => {
      expect(order[i]!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    expect(screen.getByText('1 · Read what it should do')).toBeInTheDocument();
  });

  it('has no axe violations (TS-32)', async () => {
    for (const locale of ['es', 'en'] as const) {
      const { container, unmount } = render(
        <Instructions {...base({ locale, t: makeT(locale) })} />,
      );
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});
