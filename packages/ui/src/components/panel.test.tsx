import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { Panel } from './panel';

describe('Panel', () => {
  it('renders a default panel with label and title (TS-40)', async () => {
    const { container } = render(
      <Panel label="rachas" title="Cómo funcionan las rachas">
        <p>cuerpo</p>
      </Panel>,
    );
    const section = screen.getByRole('region', { name: 'Cómo funcionan las rachas' });
    expect(section.tagName).toBe('SECTION');
    expect(section).toHaveClass(
      'flex',
      'flex-col',
      'gap-3',
      'rounded-panel',
      'border',
      'border-border',
      'bg-surface',
      'p-5',
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Cómo funcionan las rachas' });
    expect(heading).toHaveClass('font-mono', 'text-title-panel', 'text-text');
    expect(section).toHaveAttribute('aria-labelledby', heading.id);
    const label = screen.getByText('rachas').closest('p')!;
    expect(label).toHaveClass('font-mono', 'text-label-comment', 'text-text-dim');
    const slashes = label.querySelector('span[aria-hidden="true"]');
    expect(slashes?.textContent).toBe('// ');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the feature variant with datum and note (TS-41)', () => {
    render(
      <Panel
        variant="feature"
        label="racha global"
        title="Tu progreso"
        datum="racha 4"
        note="La racha global sube con cualquier desafío completado."
      >
        x
      </Panel>,
    );
    const section = screen.getByRole('region', { name: 'Tu progreso' });
    expect(section).toHaveClass('rounded-feature', 'p-7', 'gap-4');
    expect(screen.getByRole('heading', { name: 'Tu progreso' })).toHaveClass('text-title-section');
    expect(screen.getByText('racha 4')).toHaveClass('text-streak');
    const note = screen.getByText(/La racha global/);
    expect(note).toHaveClass('font-sans', 'text-caption', 'text-text-muted');
    expect(section.lastElementChild).toBe(note);
  });

  it('supports level 3 titles and consumer aria-labelledby', () => {
    render(
      <Panel title="t" titleLevel={3} aria-labelledby="own">
        x
      </Panel>,
    );
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    expect(document.querySelector('section')).toHaveAttribute('aria-labelledby', 'own');
  });

  it('has no labelledby without title and merges className', () => {
    render(<Panel className="h-full">x</Panel>);
    const section = document.querySelector('section')!;
    expect(section).not.toHaveAttribute('aria-labelledby');
    expect(section).toHaveClass('h-full');
  });

  it('body grows so a trailing action can sit at the bottom with mt-auto', () => {
    render(
      <Panel title="T">
        <p>cuerpo</p>
      </Panel>,
    );
    expect(screen.getByText('cuerpo').parentElement).toHaveClass('grow', 'flex-col');
  });

  it('renders no text of its own (TS-55)', () => {
    const { container } = render(<Panel />);
    expect(container.textContent).toBe('');
  });
});
