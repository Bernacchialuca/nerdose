import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, StrictMode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Dialog } from './dialog';

function Harness({
  closeDisabled = false,
  onClose,
  variant = 'modal',
  role,
}: {
  closeDisabled?: boolean;
  onClose?: () => void;
  variant?: 'modal' | 'drawer' | 'sheet';
  role?: 'dialog' | 'alertdialog';
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
          variant={variant}
          role={role}
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

  it('anchors the sheet to the bottom on mobile, modal from sm (S-034 TS-1, TS-2, TS-6)', () => {
    render(
      <Dialog variant="sheet" title="Reportar un problema" closeLabel="Cerrar" onClose={vi.fn()}>
        <button type="button">Uno</button>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Reportar un problema' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveClass(
      'w-full',
      'max-h-full',
      'overflow-y-auto',
      'rounded-t-panel',
      'border',
      'border-b-0',
      'border-border',
      'bg-surface',
      'p-6',
      'sm:max-w-xl',
      'sm:rounded-panel',
      'sm:border-b',
    );
    expect(dialog).not.toHaveClass('rounded-panel', 'max-w-xl');
    const overlay = dialog.parentElement as HTMLElement;
    expect(overlay).toHaveAttribute('role', 'presentation');
    expect(overlay).toHaveClass(
      'fixed',
      'inset-0',
      'z-50',
      'flex',
      'items-end',
      'justify-center',
      'bg-header',
      'pt-12',
      'sm:items-center',
      'sm:px-4',
      'sm:pt-0',
    );
    expect(overlay).not.toHaveClass('items-center');
  });

  it('keeps modal classes unchanged (S-034 TS-6)', () => {
    render(
      <Dialog variant="modal" title="Anular desafío" closeLabel="Cerrar" onClose={vi.fn()}>
        <p>x</p>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('max-w-xl', 'rounded-panel');
    expect(dialog).not.toHaveClass('rounded-t-panel', 'border-b-0');
    expect(dialog.parentElement).toHaveClass('items-center', 'px-4');
    expect(dialog.parentElement).not.toHaveClass('items-end', 'pt-12');
  });

  it('sheet keeps the dialog behavior (S-034 TS-4)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Harness variant="sheet" onClose={onClose} />);
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Uno' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Uno' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('sheet: scrim closes, panel does not, closeDisabled blocks (S-034 TS-5)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(
      <Dialog variant="sheet" title="T" closeLabel="Cerrar" onClose={onClose}>
        <button type="button">Uno</button>
      </Dialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Uno' }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    const blocked = vi.fn();
    render(
      <Dialog variant="sheet" title="T" closeLabel="Cerrar" closeDisabled onClose={blocked}>
        <p>x</p>
      </Dialog>,
    );
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    const close = screen.getByRole('button', { name: 'Cerrar' });
    await user.click(close);
    expect(blocked).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(close).toHaveAttribute('aria-disabled', 'true');
  });

  it('links the description with describedBy (S-034 TS-7)', async () => {
    const { container } = render(
      <Dialog
        variant="sheet"
        title="Reportar un problema"
        closeLabel="Cerrar"
        describedBy="spoiler"
        onClose={vi.fn()}
      >
        <div id="spoiler">
          <p>No incluyas la respuesta si todavía estás jugando.</p>
        </div>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby', 'spoiler');
    expect(dialog).toHaveAccessibleDescription(
      'No incluyas la respuesta si todavía estás jugando.',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('omits aria-describedby without describedBy (S-034 TS-8)', () => {
    render(
      <Dialog variant="modal" title="Anular desafío" closeLabel="Cerrar" onClose={vi.fn()}>
        <p>x</p>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  function Page({
    variant = 'sheet',
    role,
  }: {
    variant?: 'modal' | 'drawer' | 'sheet';
    role?: 'dialog' | 'alertdialog';
  }) {
    return (
      <>
        <header>
          <a href="/">nerdose</a>
        </header>
        <main>
          <button type="button">Abrir</button>
          <section>
            <Harness variant={variant} role={role} />
          </section>
        </main>
        <footer>pie</footer>
      </>
    );
  }

  it('makes the background inert while open and restores on close (S-034 TS-9, TS-10)', async () => {
    const user = userEvent.setup();
    const { container } = render(<Page />);
    const [, trigger] = screen.getAllByRole('button', { name: 'Abrir' });
    await user.click(trigger as HTMLElement);
    const dialog = screen.getByRole('dialog');
    expect(container.querySelector('header')?.closest('[inert]')).not.toBeNull();
    expect(container.querySelector('footer')?.closest('[inert]')).not.toBeNull();
    expect(trigger?.closest('[inert]')).not.toBeNull();
    expect(dialog.closest('[inert]')).toBeNull();
    expect(dialog.parentElement?.closest('[inert]')).toBeNull();
    await user.keyboard('{Escape}');
    expect(document.querySelector('[inert]')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('keeps pre-existing inert elements (S-034 TS-11)', async () => {
    const user = userEvent.setup();
    render(
      <>
        <aside inert>ya inerte</aside>
        <Page />
      </>,
    );
    const aside = screen.getByText('ya inerte');
    await user.click(screen.getAllByRole('button', { name: 'Abrir' })[1] as HTMLElement);
    expect(aside).toHaveAttribute('inert');
    await user.keyboard('{Escape}');
    expect(aside).toHaveAttribute('inert');
    expect(document.querySelectorAll('[inert]')).toHaveLength(1);
  });

  it('leaves no residue under StrictMode (S-034 TS-12)', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Page />
      </StrictMode>,
    );
    const trigger = screen.getAllByRole('button', { name: 'Abrir' })[1] as HTMLElement;
    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    expect(screen.getByRole('dialog').closest('[inert]')).toBeNull();
    expect(document.querySelector('header')?.closest('[inert]')).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(document.querySelector('[inert]')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it.each([
    ['modal', undefined],
    ['drawer', undefined],
    ['modal', 'alertdialog'],
  ] as const)('inerts the background in %s (%s) (S-034 TS-13)', async (variant, role) => {
    const user = userEvent.setup();
    render(<Page variant={variant} role={role} />);
    await user.click(screen.getAllByRole('button', { name: 'Abrir' })[1] as HTMLElement);
    expect(document.querySelector('header')?.closest('[inert]')).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(document.querySelector('[inert]')).toBeNull();
  });
});
