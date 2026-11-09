import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { Banner } from './banner';

const TITLE = 'Activá las cookies para poder jugar';
const DETAIL = 'Sin cookies no podemos guardar tu partida.';

describe('Banner', () => {
  it('renders the warning banner with the DS tokens (TS-26)', async () => {
    const { container } = render(<Banner title={TITLE}>{DETAIL}</Banner>);
    const status = screen.getByRole('status');
    expect(status).toHaveClass(
      'rounded-panel',
      'border',
      'border-status-warning-border',
      'bg-status-warning-bg',
      'px-5.5',
      'py-4.5',
    );
    for (const c of ['border-l-4', 'px-4', 'lg:px-12']) expect(status).not.toHaveClass(c);
    expect(status.querySelector('[aria-hidden="true"]')).toHaveClass(
      'bg-status-warning',
      'text-status-warning-on',
    );
    expect(screen.getByText(TITLE)).toHaveClass('font-mono', 'text-title-banner', 'text-text');
    expect(screen.getByText(DETAIL)).toHaveClass(
      'font-sans',
      'text-body-sm-tight',
      'text-status-warning-soft',
    );
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders title before detail in a status region', () => {
    render(<Banner title={TITLE}>{DETAIL}</Banner>);
    const text = screen.getByRole('status').textContent ?? '';
    expect(text.indexOf(TITLE)).toBeLessThan(text.indexOf(DETAIL));
  });

  it('renders only the title without detail', () => {
    render(<Banner title={TITLE} />);
    expect(screen.getByRole('status').querySelectorAll('p')).toHaveLength(1);
  });

  it('does not take focus', () => {
    render(<Banner title={TITLE}>{DETAIL}</Banner>);
    expect(screen.getByRole('status')).not.toHaveAttribute('tabindex');
    expect(document.activeElement).toBe(document.body);
  });

  it('merges className with cn', () => {
    render(<Banner title="t" className="sticky top-0 bg-bg" />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('sticky', 'top-0', 'bg-bg');
    expect(status).not.toHaveClass('bg-status-warning-bg');
  });

  it('accepts a node as title', () => {
    render(
      <Banner
        title={
          <span>
            Activá las <strong>cookies</strong>
          </span>
        }
      />,
    );
    expect(screen.getByRole('status').querySelector('strong')).toHaveTextContent('cookies');
  });

  it('has no text of its own (TS-55)', () => {
    const { container } = render(<Banner title="" />);
    expect(container.textContent).toBe('');
  });

  it('renders success as verdict (S-021 TS-10)', async () => {
    const { container } = render(
      <Banner variant="success" titleAs="h1" title="Ganaste en 4/6">
        Racha de Devdle: 3 días · racha global: 4 días
      </Banner>,
    );
    expect(screen.getByRole('status')).toHaveClass(
      'border-status-success-border',
      'bg-status-success-bg',
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Ganaste en 4/6' })).toHaveClass(
      'font-mono',
      'text-title-banner',
      'text-text',
    );
    expect(screen.getByText(/Racha de Devdle/)).toHaveClass(
      'font-sans',
      'text-body-sm-tight',
      'text-status-success-soft',
    );
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toHaveClass('bg-status-success', 'text-status-success-on');
    expect(icon?.querySelector('path')).toHaveAttribute('d', 'M20 6 9 17l-5-5');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders failure (S-021 TS-11)', async () => {
    const { container } = render(
      <Banner variant="failure" titleAs="h1" title="Era PARSER">
        Desafío completado: tus rachas siguen en pie
      </Banner>,
    );
    expect(screen.getByRole('status')).toHaveClass(
      'border-status-error-border',
      'bg-status-error-bg',
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Era PARSER' })).toBeInTheDocument();
    expect(screen.getByText(/Desafío completado/)).toHaveClass('text-status-error-soft');
    expect(container.querySelector('[aria-hidden="true"]')).toHaveClass(
      'bg-status-error',
      'text-status-error-on',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders neutral without live role or icon (S-021 TS-12)', async () => {
    const { container } = render(
      <Banner variant="neutral">
        Hoy no hay desafío de Devdle. Es un día neutro: no suma ni corta tu racha.
      </Banner>,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.firstElementChild).toHaveClass('bg-surface', 'border-border');
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.getByText(/día neutro/)).toHaveClass(
      'font-mono',
      'text-mono-body',
      'text-text-muted',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('announces neutral when asked (S-021 TS-13)', () => {
    render(
      <Banner variant="neutral" announce>
        Empezó el desafío #9. La partida de ayer quedó sin terminar y no cuenta para tu racha.
      </Banner>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Empezó el desafío #9');
    expect(screen.getByRole('status')).toHaveClass('bg-surface');
  });

  it('renders the action slot after the texts (S-021 TS-14, TS-37)', () => {
    const { container } = render(
      <Banner
        variant="success"
        title="Ganaste en 4/6"
        action={<button type="button">Siguiente juego →</button>}
      />,
    );
    const button = screen.getByRole('button', { name: 'Siguiente juego →' });
    expect(button.parentElement).toHaveClass('flex', 'flex-wrap', 'gap-2.5');
    expect(screen.getByRole('status')).not.toHaveAttribute('tabindex');
    expect(container.firstElementChild).toHaveClass('flex-wrap');
    expect(container.querySelector('.min-w-0')).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/(sm|md|lg):/);
  });

  it('has no text of its own (S-021 TS-16)', () => {
    const a = render(<Banner variant="neutral" />);
    expect(a.container.textContent).toBe('');
    a.unmount();
    const b = render(<Banner variant="success" title="" />);
    expect(b.container.textContent).toBe('');
  });
});
