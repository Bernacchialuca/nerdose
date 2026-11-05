import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from './alert';

const ERROR_MSG = 'No pudimos cargar los juegos de hoy. Revisá tu conexión e intentá de nuevo.';

function withAction(onRetry = vi.fn()) {
  return (
    <Alert
      action={
        <button type="button" onClick={onRetry}>
          Reintentar
        </button>
      }
    >
      {ERROR_MSG}
    </Alert>
  );
}

describe('Alert', () => {
  it('renders the message in an alert region (TS-15)', () => {
    render(<Alert>{ERROR_MSG}</Alert>);
    expect(screen.getByRole('alert').textContent).toBe(ERROR_MSG);
  });

  it('renders the action after the message and keeps it working (TS-16)', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(withAction(onRetry));
    const alert = screen.getByRole('alert');
    const button = within(alert).getByRole('button', { name: 'Reintentar' });
    expect(
      alert.querySelector('p')!.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await user.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders no action container without action (TS-17)', () => {
    render(<Alert>{ERROR_MSG}</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert.children).toHaveLength(1);
    expect(alert.children[0]?.tagName).toBe('P');
  });

  it('uses the design tokens (TS-18)', () => {
    render(withAction());
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('w-full', 'border-l-4', 'border-error', 'bg-surface', 'p-4');
    expect(alert.querySelector('p')).toHaveClass('text-base', 'text-error');
    expect(alert.children[1]).toHaveClass('mt-3');
    expect(alert.innerHTML).not.toContain('whitespace-nowrap');
  });

  it('does not move the focus (TS-19)', () => {
    render(withAction());
    expect(document.activeElement).toBe(document.body);
    expect(screen.getByRole('alert')).not.toHaveAttribute('tabindex');
  });

  it('merges className with cn (TS-20)', () => {
    render(<Alert className="mt-6 bg-bg">{ERROR_MSG}</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('mt-6', 'bg-bg');
    expect(alert).not.toHaveClass('bg-surface');
  });

  it('has no axe violations (TS-21)', async () => {
    const { container } = render(withAction());
    expect(await axe(container)).toHaveNoViolations();
  });

  it('accepts nodes and has no text of its own (TS-22)', () => {
    const { container, unmount } = render(
      <Alert>
        No pudimos cargar <strong>los juegos</strong>
      </Alert>,
    );
    expect(screen.getByRole('alert').querySelector('strong')).toHaveTextContent('los juegos');
    unmount();
    const empty = render(<Alert>{null}</Alert>);
    expect(empty.container.textContent).toBe('');
    expect(container).toBeDefined();
  });
});
