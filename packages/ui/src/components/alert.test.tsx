import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from './alert';

const TITLE = 'No pudimos cargar los juegos de hoy.';
const DETAIL = 'Revisá tu conexión e intentá de nuevo.';
const ERROR_MSG = `${TITLE} ${DETAIL}`;

function full(onRetry = vi.fn()) {
  return (
    <Alert
      title={TITLE}
      action={
        <button type="button" onClick={onRetry}>
          Reintentar
        </button>
      }
    >
      {DETAIL}
    </Alert>
  );
}

describe('Alert', () => {
  it('renders title, detail, icon and action with the DS tokens (TS-24)', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { container } = render(full(onRetry));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass(
      'rounded-panel',
      'border',
      'border-status-error-border',
      'bg-status-error-bg',
      'px-5.5',
      'py-4.5',
      'flex-wrap',
      'gap-4',
    );
    expect(alert.className).not.toContain('border-l-4');
    const icon = alert.querySelector('[aria-hidden="true"]');
    expect(icon).toHaveClass('size-10', 'rounded-full', 'bg-status-error', 'text-status-error-on');
    expect(icon?.querySelector('svg')).toHaveAttribute('stroke-width', '3');
    expect(screen.getByText(TITLE)).toHaveClass('font-mono', 'text-title-banner', 'text-text');
    expect(screen.getByText(DETAIL)).toHaveClass(
      'font-sans',
      'text-body-sm-tight',
      'text-status-error-soft',
    );
    const button = within(alert).getByRole('button', { name: 'Reintentar' });
    expect(
      screen.getByText(DETAIL).compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await user.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('works with only children and action, as web uses it today (TS-25)', () => {
    render(<Alert action={<button type="button">Reintentar</button>}>{ERROR_MSG}</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(ERROR_MSG);
    expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(alert.querySelectorAll('p')).toHaveLength(1);
    expect(document.activeElement).toBe(document.body);
    expect(alert).not.toHaveAttribute('tabindex');
  });

  it('renders no action container without action', () => {
    render(<Alert>{ERROR_MSG}</Alert>);
    expect(screen.getByRole('alert').children).toHaveLength(1);
  });

  it('merges className with cn', () => {
    render(<Alert className="mt-6 bg-bg">{ERROR_MSG}</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('mt-6', 'bg-bg');
    expect(alert).not.toHaveClass('bg-status-error-bg');
  });

  it('accepts nodes and has no text of its own (TS-55)', () => {
    render(
      <Alert>
        No pudimos cargar <strong>los juegos</strong>
      </Alert>,
    );
    expect(screen.getByRole('alert').querySelector('strong')).toHaveTextContent('los juegos');
  });

  it('renders no text without content (TS-55)', () => {
    const { container } = render(<Alert>{null}</Alert>);
    expect(container.textContent).toBe('');
  });
});
