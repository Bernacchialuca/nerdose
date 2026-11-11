import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { SelectField, TextAreaField, TextField } from './form-field';

describe('form-field', () => {
  it('liga label, error y estado inválido', async () => {
    const { container } = render(
      <>
        <TextField label="Nombre" error="Falta" />
        <TextAreaField label="Motivo" />
        <SelectField label="Culpable" defaultValue="">
          <option value="" disabled>
            Elegí
          </option>
          <option value="a">A</option>
        </SelectField>
      </>,
    );
    const input = screen.getByLabelText('Nombre');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAccessibleDescription('Falta');
    expect(screen.getByLabelText('Motivo')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Culpable')).toHaveValue('');
    expect(await axe(container)).toHaveNoViolations();
  });
});
