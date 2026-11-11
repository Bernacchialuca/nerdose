import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { SelectField, TextAreaField, TextField } from './form-field';

describe('form-field', () => {
  it('ties label, error and required state (S-033 TS-9)', () => {
    render(
      <TextField label="Contraseña" type="password" required error="Ingresá la contraseña." />,
    );
    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAccessibleDescription('Ingresá la contraseña.');
    expect(input).toHaveClass('border-error');
    expect(input).not.toHaveClass('border-border-interactive');
    expect(input).not.toHaveAttribute('required');
    const error = screen.getByText('Ingresá la contraseña.');
    expect(error.tagName).toBe('P');
    expect(error).toHaveClass('text-caption', 'text-error');
  });

  it('describes with hint first, then error (S-033 TS-10)', () => {
    render(
      <TextAreaField
        label="Motivo de la anulación"
        hint="0 / 500"
        error="Contá por qué se anula el desafío."
        maxLength={500}
      />,
    );
    const area = screen.getByLabelText('Motivo de la anulación');
    expect(area).toHaveAccessibleDescription('0 / 500 Contá por qué se anula el desafío.');
    const ids = (area.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0] ?? '')).toHaveTextContent('0 / 500');
    expect(area).toHaveAttribute('maxlength', '500');
    expect(area).toHaveAttribute('rows', '4');
  });

  it('renders plain fields without aria extras and passes axe (S-033 TS-11)', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <TextAreaField label="Mensaje (opcional)" rows={3} />
        <SelectField label="Culpable del error" defaultValue="">
          <option value="" disabled>
            Elegí un culpable
          </option>
          <option value="template">La plantilla del juego</option>
        </SelectField>
      </>,
    );
    const area = screen.getByLabelText('Mensaje (opcional)');
    for (const a of ['aria-invalid', 'aria-required', 'aria-describedby'])
      expect(area).not.toHaveAttribute(a);
    expect(area).toHaveAttribute('rows', '3');
    expect(area).toHaveClass('border-border-interactive');
    const select = screen.getByLabelText('Culpable del error');
    expect(select).toHaveValue('');
    await user.selectOptions(select, 'template');
    expect(select).toHaveValue('template');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('forwards refs and native props to the control (S-033 TS-12)', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <TextField label="Contraseña" inputRef={ref} autoComplete="current-password" disabled />,
    );
    const input = screen.getByLabelText('Contraseña');
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('autocomplete', 'current-password');
    expect(input).toBeDisabled();
    expect(screen.getByText('Contraseña')).toHaveAttribute('for', input.id);
  });
});
