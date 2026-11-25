// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Result } from './result';
import { RESULT_0_ES, RESULT_3_EN, RESULT_3_ES, RESULT_5_ES } from './test-fixtures';
import { makeT } from './test-utils';
import type { ResultProps } from './types';

const base = (over: Partial<ResultProps> = {}): ResultProps => ({
  number: 8,
  locale: 'es',
  t: makeT('es'),
  result: RESULT_3_ES,
  gameStats: null,
  ...over,
});

const lists = () => screen.getAllByRole('list');

describe('Result 3/5', () => {
  it('shows comment, verdict, score and headings (TS-43)', () => {
    render(<Result {...base()} />);
    expect(screen.getByText('// consigna: del más antiguo al más reciente')).toBeInTheDocument();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Casi: solo dos hitos cruzados');
    expect(h1).not.toHaveTextContent('3');
    expect(h1).not.toHaveTextContent('✓');
    const score = screen.getByText('3/5').closest('p') as HTMLElement;
    expect(score).toHaveTextContent('posiciones');
    expect(score).toHaveTextContent('correctas');
    expect(screen.getByRole('heading', { level: 2, name: /tu orden/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /orden correcto/ })).toBeInTheDocument();
  });

  it('marks each submitted position without red (TS-44)', () => {
    const { container } = render(<Result {...base()} />);
    const rows = within(lists()[0] as HTMLElement).getAllByRole('listitem');
    expect(rows).toHaveLength(5);
    const sr = [
      'Python, posición 1: bien',
      'Go, posición 2: mal ubicado, va en 3°',
      'Java, posición 3: mal ubicado, va en 2°',
      'Docker, posición 4: bien',
      'Kubernetes, posición 5: bien',
    ];
    rows.forEach((row, i) => expect(row).toHaveTextContent(sr[i] as string));
    expect(within(lists()[0] as HTMLElement).getAllByText('✓ bien')).toHaveLength(3);
    expect(screen.getByText('✗ va en 3°')).toBeInTheDocument();
    expect(screen.getByText('✗ va en 2°')).toBeInTheDocument();
    [1, 2].forEach((i) => {
      expect(rows[i]).toHaveClass('border-dashed', 'border-status-misplaced-border');
    });
    [0, 3, 4].forEach((i) => expect(rows[i]).toHaveClass('border-status-success-border'));
    expect(container.innerHTML).not.toContain('status-error');
  });

  it('wraps name and badge in one flex-wrap group so the badge drops below (TS-5)', () => {
    render(<Result {...base()} />);
    const row = within(lists()[0] as HTMLElement).getAllByRole('listitem')[4] as HTMLElement;
    const name = within(row).getByText('Kubernetes');
    const badge = within(row).getByText('✓ bien');
    expect(name.parentElement).toBe(badge.parentElement);
    expect(name.parentElement).toHaveClass(
      'flex',
      'flex-wrap',
      'min-w-0',
      'grow',
      'items-center',
      'gap-x-3',
      'gap-y-1',
    );
    expect(name).toHaveClass('min-w-0', 'grow', 'break-words');
    expect(row).toHaveClass('py-2', 'min-h-13');
  });

  it('shows the correct order with dates by precision and notes (TS-45)', () => {
    render(<Result {...base()} />);
    const items = within(lists()[1] as HTMLElement).getAllByRole('listitem');
    const PL = '// lenguajes de programación';
    const ST = '// software y herramientas';
    const expected = [
      ['20 de febrero de 1991', 'Python', 'nota de Python', PL],
      ['23 de mayo de 1995', 'Java', 'nota de Java', PL],
      ['2009', 'Go', 'nota de Go', PL],
      ['20 de marzo de 2013', 'Docker', 'nota de Docker', ST],
      ['junio de 2014', 'Kubernetes', 'nota de Kubernetes', ST],
    ];
    items.forEach((li, i) => {
      const [date, name, note, category] = expected[i] as string[];
      const dateEl = within(li).getByText(date as string);
      const nameEl = within(li).getByText(name as string);
      expect(within(li).getByText(note as string)).toBeInTheDocument();
      expect(within(li).getByText(category as string)).toBeInTheDocument();
      expect(
        dateEl.compareDocumentPosition(nameEl) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(li.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });
  });
});

describe('Result verdict', () => {
  it.each([
    [0, 'Hoy ganó la historia'],
    [1, 'La historia es traicionera'],
    [2, 'A mitad de camino'],
    [3, 'Casi: solo dos hitos cruzados'],
  ])('does not repeat the score in the title (%i/5)', (score, verdict) => {
    const items = RESULT_3_ES.items;
    render(<Result {...base({ result: { ...RESULT_3_ES, score, win: false, items } })} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(verdict);
    expect(screen.getByText(`${score}/5`)).toBeInTheDocument();
  });
});

describe('Result variants', () => {
  it('renders in English (TS-46)', () => {
    render(<Result {...base({ locale: 'en', t: makeT('en'), result: RESULT_3_EN })} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'So close: just two milestones swapped',
    );
    expect(screen.getAllByText('// programming languages')).toHaveLength(3);
    expect(screen.getAllByText('// software and tools')).toHaveLength(2);
    expect(screen.getByText('February 20, 1991')).toBeInTheDocument();
    expect(screen.getByText('June 2014')).toBeInTheDocument();
    expect(screen.getByText('note on Python')).toBeInTheDocument();
    expect(screen.getAllByText('✓ right')).toHaveLength(3);
    expect(screen.getByText('✗ goes 3°')).toBeInTheDocument();
  });

  it('shows the win (TS-47)', () => {
    render(<Result {...base({ result: RESULT_5_ES })} />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Orden perfecto');
    const check = within(h1).getByText('✓');
    expect(check).toHaveAttribute('aria-hidden', 'true');
    expect(check).toHaveClass('text-status-success');
    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(screen.getAllByText('✓ bien')).toHaveLength(5);
  });

  it('shows zero hits (TS-48)', () => {
    render(<Result {...base({ result: RESULT_0_ES })} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hoy ganó la historia');
    expect(screen.getByText('0/5')).toBeInTheDocument();
    for (const t of ['✗ va en 2°', '✗ va en 3°', '✗ va en 4°', '✗ va en 5°', '✗ va en 1°']) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
  });

  it('renders slots and layout (TS-49)', () => {
    const { container, rerender } = render(
      <Result
        {...base({
          aside: <p>rachas host</p>,
          footer: <p>cierre host</p>,
          notices: <p>aviso</p>,
        })}
      />,
    );
    // The host's cards go right below «tu orden» (left column on desktop, after the rail on mobile).
    const yourOrder = screen.getByRole('region', { name: /tu orden/ });
    const leftCol = yourOrder.parentElement?.parentElement as HTMLElement;
    expect(leftCol).toHaveClass('contents', 'lg:col-span-5');
    for (const text of ['rachas host', 'cierre host']) {
      const slot = screen.getByText(text).parentElement as HTMLElement;
      expect(slot.parentElement).toBe(leftCol);
      expect(slot.className).toMatch(/order-[34]/);
      expect(
        yourOrder.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    const rail = screen.getByRole('region', { name: /orden correcto/ }).parentElement;
    expect(rail).toHaveClass('order-2', 'lg:col-span-7');
    const rows = container.querySelectorAll('.flex-wrap');
    expect(rows[0]).toHaveClass('items-end', 'justify-between');
    rerender(<Result {...base()} />);
    expect(screen.queryByText('cierre host')).not.toBeInTheDocument();
  });

  it('throws on an invalid result (TS-50)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Result {...base({ result: { win: true } })} />)).toThrow(ZodError);
    spy.mockRestore();
  });
});

describe('Result a11y (TS-51)', () => {
  it.each([
    ['3/5', RESULT_3_ES, 'es'],
    ['5/5', RESULT_5_ES, 'es'],
    ['0/5', RESULT_0_ES, 'es'],
    ['en', RESULT_3_EN, 'en'],
  ] as const)('has no axe violations (%s)', async (_n, result, locale) => {
    const { container } = render(<Result {...base({ result, locale, t: makeT(locale) })} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
