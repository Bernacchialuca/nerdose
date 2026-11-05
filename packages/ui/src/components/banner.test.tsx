import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { Banner } from './banner';

const TITLE = 'Activá las cookies para poder jugar';
const DETAIL = 'Sin cookies no podemos guardar tu partida.';

describe('Banner', () => {
  it('renders title and detail in a status region (TS-9)', () => {
    render(<Banner title={TITLE}>{DETAIL}</Banner>);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(TITLE);
    expect(status).toHaveTextContent(DETAIL);
    expect(status.textContent?.indexOf(TITLE)).toBeLessThan(status.textContent?.indexOf(DETAIL) ?? 0);
  });

  it('renders only the title without detail container (TS-10)', () => {
    render(<Banner title={TITLE} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe(TITLE);
    expect(status.children).toHaveLength(1);
  });

  it('is not dismissible and does not take focus (TS-11)', () => {
    render(<Banner title={TITLE}>{DETAIL}</Banner>);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('status')).not.toHaveAttribute('tabindex');
    expect(document.activeElement).toBe(document.body);
  });

  it('uses the design tokens (TS-12)', () => {
    render(<Banner title={TITLE}>{DETAIL}</Banner>);
    const status = screen.getByRole('status');
    for (const c of ['bg-surface', 'border-l-4', 'border-warning', 'px-4', 'lg:px-12']) {
      expect(status).toHaveClass(c);
    }
    expect(screen.getByText(TITLE)).toHaveClass('text-warning', 'font-bold');
    expect(screen.getByText(DETAIL)).toHaveClass('text-xs', 'text-text-muted');
  });

  it('merges className with cn (TS-13)', () => {
    render(<Banner title="t" className="sticky top-0 bg-bg" />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('sticky', 'top-0', 'bg-bg');
    expect(status).not.toHaveClass('bg-surface');
  });

  it('has no axe violations (TS-14)', async () => {
    const { container } = render(<Banner title={TITLE}>{DETAIL}</Banner>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('accepts a node as title (TS-15)', () => {
    render(<Banner title={<span>Activá las <strong>cookies</strong></span>} />);
    expect(screen.getByRole('status').querySelector('strong')).toHaveTextContent('cookies');
  });

  it('has no text of its own (TS-25)', () => {
    const { container } = render(<Banner title="" />);
    expect(container.textContent).toBe('');
  });
});
