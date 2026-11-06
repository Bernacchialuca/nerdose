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
});
