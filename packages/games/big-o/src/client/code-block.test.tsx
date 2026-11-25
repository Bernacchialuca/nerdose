// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeBlock } from './code-block';
import { loadTokenizer } from './highlight';
import { codeLines } from './lines';
import { CODE, PUBLIC_VIEW_OTHER } from './test-fixtures';
import { makeT } from './test-utils';

vi.mock('./highlight', () => ({ loadTokenizer: vi.fn(() => new Promise(() => {})) }));

const mockedLoad = vi.mocked(loadTokenizer);
const NOTES = [
  { line: 3, text: 'n veces' },
  { line: 4, text: 'log n veces' },
];
const t = makeT('es');
const panelLines = () =>
  [...screen.getByRole('tabpanel').querySelectorAll('[data-line]')] as HTMLElement[];
const lineText = (el: HTMLElement) => el.querySelector('.whitespace-pre')?.textContent;
const coloredSpans = () =>
  [...screen.getByRole('tabpanel').querySelectorAll<HTMLElement>('span')].filter(
    (s) => s.style.color,
  );

beforeEach(() => {
  mockedLoad.mockReset();
  mockedLoad.mockImplementation(() => new Promise(() => {}));
});

describe('CodeBlock touch targets and line numbers (TS-7, TS-10)', () => {
  it('renders 44px tabs and dim line numbers', () => {
    render(<CodeBlock code={CODE} initialLanguage="go" t={t} highlight={false} />);
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toHaveClass('min-h-11');
      expect(tab).not.toHaveClass('min-h-10');
    }
    const num = screen
      .getByRole('tabpanel')
      .querySelector('[data-line="1"] span[aria-hidden="true"]') as HTMLElement;
    expect(num).toHaveClass('text-text-dim');
  });
});

describe('CodeBlock plain structure (TS-19)', () => {
  it('renders tabs, panel and numbered lines', () => {
    const { container } = render(
      <CodeBlock code={CODE} initialLanguage="go" t={t} highlight={false} />,
    );
    expect(screen.getByRole('tablist', { name: 'Lenguaje del código' })).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((x) => x.textContent)).toEqual(['JavaScript', 'Go', 'Java']);
    expect(screen.getByRole('tab', { name: 'Go' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Go' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByText('f.go')).toBeInTheDocument();
    const panel = screen.getByRole('tabpanel', { name: 'Código de f(n) en Go' });
    expect(panel).toHaveAttribute('tabindex', '0');
    const lines = panelLines();
    expect(lines).toHaveLength(9);
    expect(lines.map(lineText)).toEqual(codeLines(CODE.go));
    expect(lineText(lines[2] as HTMLElement)).toBe('\tfor i := 0; i < n; i++ {');
    expect(lines[2]?.querySelector('.whitespace-pre')).toBeInTheDocument();
    lines.forEach((l, i) => {
      const num = l.querySelector('[aria-hidden="true"]');
      expect(num?.textContent).toBe(String(i + 1));
    });
    expect(coloredSpans()).toHaveLength(0);
    expect((container.firstElementChild as HTMLElement).getAttribute('style')).toContain(
      '--shiki-token-keyword: var(--color-game-big-o)',
    );
  });
});

describe('CodeBlock keyboard and click (TS-20)', () => {
  it('moves between tabs with arrows, Home and End', async () => {
    const user = userEvent.setup();
    const onLanguageChange = vi.fn();
    render(
      <CodeBlock
        code={CODE}
        initialLanguage="go"
        t={t}
        highlight={false}
        onLanguageChange={onLanguageChange}
      />,
    );
    screen.getByRole('tab', { name: 'Go' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Java' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Java' })).toHaveFocus();
    expect(lineText(panelLines()[0] as HTMLElement)).toBe('static int f(int n) {');
    expect(onLanguageChange).toHaveBeenLastCalledWith('java');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(lineText(panelLines()[0] as HTMLElement)).toBe('function f(n) {');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Java' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Java' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Go' }));
    expect(screen.getByRole('tabpanel', { name: 'Código de f(n) en Go' })).toBeInTheDocument();
    expect(onLanguageChange).toHaveBeenLastCalledWith('go');
  });
});

describe('CodeBlock notes (TS-21)', () => {
  it('highlights the noted lines and keeps them across tabs', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CodeBlock code={CODE} initialLanguage="js" t={t} notes={NOTES} highlight={false} />,
    );
    const check = () => {
      const lines = panelLines();
      for (const i of [2, 3]) {
        expect(lines[i]).toHaveClass('bg-game-big-o-tint');
        expect(lines[i]).toHaveClass('shadow-[inset_3px_0_0_var(--color-game-big-o)]');
      }
      expect(lines[2]).toHaveTextContent('n veces');
      expect(lines[3]).toHaveTextContent('log n veces');
      const describedBy = lines[2]?.getAttribute('aria-describedby') as string;
      expect(document.getElementById(describedBy)).toHaveTextContent('n veces');
      for (const i of [0, 1, 4, 5, 6, 7, 8]) {
        expect(lines[i]).not.toHaveClass('bg-game-big-o-tint');
        expect(lines[i]).not.toHaveAttribute('aria-describedby');
      }
    };
    check();
    const note = screen.getByText('n veces');
    expect(note).toHaveClass('basis-full');
    expect(note).toHaveClass('@lg:basis-auto');
    expect(container.firstElementChild).toHaveClass('@container');
    await user.click(screen.getByRole('tab', { name: 'Go' }));
    check();
  });
});

describe('CodeBlock highlight (TS-22 to TS-24)', () => {
  const fakeTokenizer = (code: string) =>
    codeLines(code).map((line) => [{ content: line, color: 'var(--shiki-token-keyword)' }]);

  it('colors without changing the structure when Shiki loads', async () => {
    mockedLoad.mockResolvedValue(fakeTokenizer as never);
    render(<CodeBlock code={CODE} initialLanguage="js" t={t} />);
    const panel = screen.getByRole('tabpanel');
    const before = panel.textContent;
    const count = panelLines().length;
    await waitFor(() => expect(coloredSpans()).toHaveLength(9));
    expect(coloredSpans()[0]?.style.color).toBe('var(--shiki-token-keyword)');
    expect(panel.textContent).toBe(before);
    expect(panelLines()).toHaveLength(count);
  });

  it('starts plain before loading resolves', () => {
    render(<CodeBlock code={CODE} initialLanguage="js" t={t} />);
    expect(coloredSpans()).toHaveLength(0);
  });

  it('stays plain when loading rejects', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedLoad.mockRejectedValue(new Error('boom'));
    render(<CodeBlock code={CODE} initialLanguage="js" t={t} />);
    await waitFor(() => expect(mockedLoad).toHaveBeenCalled());
    expect(coloredSpans()).toHaveLength(0);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('stays plain when the tokenizer throws or returns the wrong number of lines', async () => {
    mockedLoad.mockResolvedValue((() => {
      throw new Error('bad');
    }) as never);
    const first = render(<CodeBlock code={CODE} initialLanguage="js" t={t} />);
    await waitFor(() => expect(mockedLoad).toHaveBeenCalled());
    await Promise.resolve();
    expect(coloredSpans()).toHaveLength(0);
    first.unmount();
    mockedLoad.mockResolvedValue(((code: string) => fakeTokenizer(code).slice(1)) as never);
    render(<CodeBlock code={CODE} initialLanguage="js" t={t} />);
    await waitFor(() => expect(mockedLoad).toHaveBeenCalledTimes(2));
    await Promise.resolve();
    expect(coloredSpans()).toHaveLength(0);
  });

  it('does not load Shiki when highlight is false', () => {
    render(<CodeBlock code={CODE} initialLanguage="js" t={t} highlight={false} />);
    expect(mockedLoad).not.toHaveBeenCalled();
  });
});

describe('CodeBlock disabled (TS-25)', () => {
  it('ignores clicks and keys', async () => {
    const user = userEvent.setup();
    const onLanguageChange = vi.fn();
    render(
      <CodeBlock
        code={CODE}
        initialLanguage="js"
        t={t}
        highlight={false}
        disabled
        onLanguageChange={onLanguageChange}
      />,
    );
    for (const tab of screen.getAllByRole('tab'))
      expect(tab).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('tab', { name: 'Java' }));
    screen.getByRole('tab', { name: 'JavaScript' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(onLanguageChange).not.toHaveBeenCalled();
  });
});

describe('CodeBlock reset', () => {
  it('returns to the initial language when the code changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CodeBlock code={CODE} initialLanguage="js" t={t} highlight={false} />,
    );
    await user.click(screen.getByRole('tab', { name: 'Go' }));
    rerender(
      <CodeBlock code={PUBLIC_VIEW_OTHER.code} initialLanguage="js" t={t} highlight={false} />,
    );
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      within(screen.getByRole('tabpanel')).getByText('if (n < 2) {', { exact: false }),
    ).toBeInTheDocument();
  });
});

describe('CodeBlock accessibility (TS-26)', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <CodeBlock code={CODE} initialLanguage="js" t={t} notes={NOTES} highlight={false} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
