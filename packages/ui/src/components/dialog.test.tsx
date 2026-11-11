import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Dialog } from './dialog';

function Harness({
  closeDisabled = false,
  onClose,
}: {
  closeDisabled?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Abrir
      </button>
      {open ? (
        <Dialog
          variant="modal"
          title="Anular desafío"
          closeLabel="Cerrar"
          closeDisabled={closeDisabled}
          onClose={() => {
            onClose?.();
            setOpen(false);
          }}
        >
          <button type="button">Uno</button>
        </Dialog>
      ) : null}
    </>
  );
}

describe('Dialog', () => {
  it('traps focus and exposes dialog semantics (S-033 TS-4)', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    const dialog = screen.getByRole('dialog', { name: 'Anular desafío' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Uno' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Uno' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
    const heading = screen.getByRole('heading', { name: 'Anular desafío' });
    for (const k of ['font-mono', 'text-title-panel', 'text-text']) expect(heading).toHaveClass(k);
    expect(dialog).toHaveClass('max-w-xl', 'rounded-panel');
    expect(dialog.parentElement).toHaveClass('z-50', 'bg-header');
  });

  it('closes with Escape and returns focus to the trigger (S-033 TS-5)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('blocks Escape, overlay and close button when closeDisabled (S-033 TS-6)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness closeDisabled onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    const close = screen.getByRole('button', { name: 'Cerrar' });
    await user.click(close);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(close).toHaveAttribute('aria-disabled', 'true');
    expect(close).toHaveClass('text-text-disabled', 'cursor-not-allowed');
  });

  it('anchors the drawer to the right and closes from the overlay only (S-033 TS-7)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Dialog variant="drawer" title="Devdle #8" closeLabel="Cerrar" onClose={onClose}>
        <p>x</p>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass(
      'fixed',
      'inset-y-0',
      'right-0',
      'w-full',
      'max-w-5xl',
      'overflow-y-auto',
    );
    expect(dialog.parentElement).toHaveClass('z-40');
    expect(dialog.parentElement).not.toHaveClass('z-50');
    await user.click(screen.getByText('x'));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('honors initialFocusRef, titleRef and alertdialog role (S-033 TS-8)', () => {
    const ref = createRef<HTMLButtonElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    render(
      <Dialog
        variant="modal"
        role="alertdialog"
        title="¿Rendirte?"
        closeLabel="Cerrar"
        initialFocusRef={ref}
        titleRef={titleRef}
        onClose={() => undefined}
      >
        <button ref={ref} type="button">
          Seguir jugando
        </button>
      </Dialog>,
    );
    expect(screen.getByRole('alertdialog', { name: '¿Rendirte?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seguir jugando' })).toHaveFocus();
    expect(titleRef.current?.tagName).toBe('H2');
    expect(titleRef.current).toHaveAttribute('tabindex', '-1');
  });
});
