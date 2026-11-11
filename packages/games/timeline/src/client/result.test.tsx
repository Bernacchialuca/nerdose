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
    expect(
      screen.getByText('// consigna: del más antiguo al más reciente · lenguajes de programación'),
    ).toBeInTheDocument();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('3 de 5 en su lugar');
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

  it('shows the correct order with dates by precision and notes (TS-45)', () => {
    render(<Result {...base()} />);
    const items = within(lists()[1] as HTMLElement).getAllByRole('listitem');
    const expected = [
      ['20 de febrero de 1991', 'Python', 'nota de Python'],
      ['23 de mayo de 1995', 'Java', 'nota de Java'],
      ['2009', 'Go', 'nota de Go'],
      ['20 de marzo de 2013', 'Docker', 'nota de Docker'],
      ['junio de 2014', 'Kubernetes', 'nota de Kubernetes'],
    ];
    items.forEach((li, i) => {
      const [date, name, note] = expected[i] as string[];
      const dateEl = within(li).getByText(date as string);
      const nameEl = within(li).getByText(name as string);
      expect(within(li).getByText(note as string)).toBeInTheDocument();
      expect(
        dateEl.compareDocumentPosition(nameEl) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(li.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });
  });
});

describe('Result variants', () => {
  it('renders in English (TS-46)', () => {
    render(<Result {...base({ locale: 'en', t: makeT('en'), result: RESULT_3_EN })} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('3 of 5 in place');
    expect(screen.getByText(/programming languages/)).toBeInTheDocument();
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
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Ninguno en su lugar esta vez',
    );
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
    const lastList = lists()[1] as HTMLElement;
    for (const text of ['rachas host', 'cierre host']) {
      expect(
        lastList.compareDocumentPosition(screen.getByText(text)) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    const rows = container.querySelectorAll('.flex-wrap');
    expect(rows[0]).toHaveClass('items-end', 'justify-between');
    const listRow = rows[1] as HTMLElement;
    expect(listRow.children[0]).toHaveClass('grow', 'basis-80');
    expect(listRow.children[1]).toHaveClass('grow-2', 'basis-130');
    rerender(<Result {...base()} />);
    expect(container.querySelectorAll('.flex-wrap')).toHaveLength(2);
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
