import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Dialog } from './dialog';

function Harness({ closeDisabled = false }: { closeDisabled?: boolean }) {
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
          title="Título"
          closeDisabled={closeDisabled}
          onClose={() => {
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
  it('enfoca Cerrar, atrapa Tab, cierra con Escape y devuelve el foco', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Título' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Uno' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Uno' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('con closeDisabled ni Escape ni el overlay cierran', async () => {
    const user = userEvent.setup();
    render(<Harness closeDisabled />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('el clic en el overlay cierra', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Dialog variant="drawer" title="D" onClose={onClose}>
        <p>x</p>
      </Dialog>,
    );
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
