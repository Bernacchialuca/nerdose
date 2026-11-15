// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeBlock, type MarkLabel } from './code-block';
import { loadTokenizer } from './highlight';
import { codeLines } from './lines';
import { resultLineMarks } from './marks';
import { parseResult } from './parse';
import { CODE, RESULT_LOST_GO_ES, RESULT_WON_JAVA_ES } from './test-fixtures';
import { makeT } from './test-utils';

vi.mock('./highlight', () => ({ loadTokenizer: vi.fn(() => new Promise(() => {})) }));

const mockedLoad = vi.mocked(loadTokenizer);
const t = makeT('es');
const PICKABLE = [2, 3, 4, 5, 8];
const markLabel: MarkLabel = (m) =>
  m === 'found'
    ? { glyph: '✓', text: 'acá estaba el bug' }
    : m === 'bug'
      ? { glyph: '🐛', text: 'acá estaba el bug' }
      : { glyph: '✗', text: 'tu elección' };
const lineEl = (n: number) =>
  screen.getByRole('tabpanel').querySelector(`[data-line="${n}"]`) as HTMLElement;
const lineText = (n: number) => lineEl(n).querySelector('.whitespace-pre')?.textContent;
const coloredSpans = () =>
  [...screen.getByRole('tabpanel').querySelectorAll<HTMLElement>('span')].filter(
    (s) => s.style.color,
  );

beforeEach(() => {
  mockedLoad.mockReset();
  mockedLoad.mockImplementation(() => new Promise(() => {}));
});

const select = (over: Partial<Parameters<typeof CodeBlock>[0]> = {}) => (
  <CodeBlock
    mode="select"
    name="maxIndex"
    code={CODE}
    initialLanguage="go"
    pickable={PICKABLE}
    selected={null}
    onSelect={vi.fn()}
    t={t}
    highlight={false}
    {...over}
  />
);

function Controlled({ onSelect }: { onSelect: (n: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  return select({
    selected,
    onSelect: (n) => {
      setSelected(n);
      onSelect(n);
    },
  });
}

describe('CodeBlock select: structure (TS-18)', () => {
  it('renders tabs, a radiogroup with eligible lines only and plain text for the rest', () => {
    render(select());
    expect(screen.getByRole('tablist', { name: 'Lenguaje del código' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((x) => x.textContent)).toEqual([
      'JavaScript',
      'Go',
      'Java',
    ]);
    const go = screen.getByRole('tab', { name: 'Go' });
    expect(go).toHaveAttribute('aria-selected', 'true');
    expect(go).toHaveAttribute('tabindex', '0');
    expect(go).toHaveClass('bg-game-bug-hunt-tint-strong', 'text-game-bug-hunt');
    expect(screen.getByText('max_index.go')).toBeInTheDocument();
    const group = screen.getByRole('radiogroup', { name: 'Líneas de maxIndex en Go' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Línea 2: best := 0',
      'Línea 3: for i := 1; i < len(nums); i++ {',
      'Línea 4: if nums[i] >= nums[best] {',
      'Línea 5: best = i',
      'Línea 8: return best',
    ]);
    for (const r of radios) expect(r).toHaveAttribute('aria-checked', 'false');
    expect(radios[0]).toHaveAttribute('tabindex', '0');
    radios.slice(1).forEach((r) => expect(r).toHaveAttribute('tabindex', '-1'));
    for (const n of [1, 6, 7, 9]) {
      const el = lineEl(n);
      expect(el.tagName).not.toBe('BUTTON');
      expect(el).not.toHaveAttribute('tabindex');
      expect(el).toHaveClass('text-text-dim');
    }
    for (let n = 1; n <= 9; n++) {
      const num = lineEl(n).querySelector('[aria-hidden="true"]');
      expect(num).toHaveTextContent(String(n));
      expect(num).toHaveClass('text-meta', 'text-text-dim');
    }
    expect(coloredSpans()).toHaveLength(0);
    const root = screen.getByRole('tablist').closest('.\\@container') as HTMLElement;
    expect(root.style.getPropertyValue('--shiki-token-keyword')).toBe('var(--color-game-bug-hunt)');
    expect(screen.getByRole('tabpanel')).not.toHaveAttribute('tabindex');
    expect(group).not.toHaveAttribute('tabindex');
  });
});

describe('CodeBlock tabs (TS-19)', () => {
  it('switches with arrows, Home, End and click, moving focus with the selection', async () => {
    const user = userEvent.setup();
    const onLanguageChange = vi.fn();
    render(
      <CodeBlock
        mode="result"
        name="maxIndex"
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
    expect(lineText(1)).toBe('static int maxIndex(int[] nums) {');
    expect(screen.getByText('MaxIndex.java')).toBeInTheDocument();
    expect(onLanguageChange).toHaveBeenLastCalledWith('java');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(lineText(1)).toBe('function maxIndex(nums) {');
    expect(screen.getByText('max-index.js')).toBeInTheDocument();
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
    expect(screen.getByRole('tab', { name: 'Go' })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel', { name: 'Código de maxIndex en Go' });
    expect(panel).toHaveAttribute('tabindex', '0');
    await user.click(screen.getByRole('tab', { name: 'Java' }));
    expect(screen.getByRole('tabpanel', { name: 'Código de maxIndex en Java' })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });
});

describe('CodeBlock select: choosing (TS-20)', () => {
  it('picks with click and Space, moves focus with arrows, ignores Enter and non-eligible lines', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Controlled onSelect={onSelect} />);
    const radio = (n: number) => screen.getByRole('radio', { name: new RegExp(`^Línea ${n}:`) });
    await user.click(radio(4));
    expect(onSelect).toHaveBeenLastCalledWith(4);
    expect(radio(4)).toHaveAttribute('aria-checked', 'true');
    expect(radio(4)).toHaveAttribute('tabindex', '0');
    expect(radio(4)).toHaveClass('bg-game-bug-hunt-tint', 'shadow-bar-bug-hunt');
    const tag = radio(4).querySelector('[aria-hidden="true"].sticky') as HTMLElement;
    expect(tag).toHaveTextContent('◀');
    expect(within(tag).getByText('tu elección')).toHaveClass('hidden', '@lg:inline');
    await user.keyboard('{ArrowDown}');
    expect(radio(5)).toHaveFocus();
    expect(radio(4)).toHaveAttribute('aria-checked', 'true');
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenLastCalledWith(5);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(radio(3)).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(radio(2)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(radio(2)).toHaveFocus();
    await user.keyboard('{End}');
    expect(radio(8)).toHaveFocus();
    expect(radio(5)).toHaveAttribute('aria-checked', 'true');
    const calls = onSelect.mock.calls.length;
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(calls);
    await user.click(lineEl(6));
    expect(onSelect).toHaveBeenCalledTimes(calls);
  });
});

describe('CodeBlock result (TS-21)', () => {
  it('marks the lost lines with tags tied to their line', async () => {
    const user = userEvent.setup();
    render(
      <CodeBlock
        mode="result"
        name="maxIndex"
        code={CODE}
        initialLanguage="go"
        t={t}
        highlight={false}
        marks={resultLineMarks(parseResult(RESULT_LOST_GO_ES))}
        markLabel={markLabel}
      />,
    );
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    const bug = lineEl(4);
    expect(bug).toHaveClass('bg-game-bug-hunt-tint', 'shadow-bar-bug-hunt');
    const bugTag = document.getElementById(
      bug.getAttribute('aria-describedby') as string,
    ) as HTMLElement;
    expect(bugTag).toHaveTextContent('🐛 acá estaba el bug');
    expect(bugTag.querySelector('[aria-hidden="true"]')).toHaveTextContent('🐛');
    expect(bugTag).toHaveClass('basis-full', '@lg:basis-auto');
    const wrong = lineEl(5);
    expect(wrong).toHaveClass(
      'bg-status-error-bg',
      'shadow-[inset_3px_0_0_var(--color-status-error)]',
    );
    expect(
      document.getElementById(wrong.getAttribute('aria-describedby') as string),
    ).toHaveTextContent('✗ tu elección');
    expect(lineEl(3)).not.toHaveAttribute('aria-describedby');
    await user.click(screen.getByRole('tab', { name: 'JavaScript' }));
    expect(lineEl(4)).toHaveClass('bg-game-bug-hunt-tint');
    expect(lineEl(5)).toHaveClass('bg-status-error-bg');
  });

  it('marks a win as found', () => {
    render(
      <CodeBlock
        mode="result"
        name="maxIndex"
        code={CODE}
        initialLanguage="java"
        t={t}
        highlight={false}
        marks={resultLineMarks(parseResult(RESULT_WON_JAVA_ES))}
        markLabel={markLabel}
      />,
    );
    expect(lineEl(4)).toHaveClass(
      'bg-status-success-bg',
      'shadow-[inset_3px_0_0_var(--color-status-success)]',
    );
    expect(
      document.getElementById(lineEl(4).getAttribute('aria-describedby') as string),
    ).toHaveTextContent('✓ acá estaba el bug');
  });
});

describe('CodeBlock highlighting (TS-22 to TS-24)', () => {
  const fake = (code: string, lang: 'js' | 'go' | 'java') =>
    codeLines(CODE[lang] ?? code).map((content) => [
      { content, color: 'var(--shiki-token-keyword)' },
    ]);

  it('colors only eligible lines in select mode and all lines in result mode, without layout shift', async () => {
    mockedLoad.mockResolvedValue(fake);
    const { container, unmount } = render(select({ highlight: true }));
    const before = container.textContent;
    await waitFor(() => expect(coloredSpans()).toHaveLength(5));
    expect(container.textContent).toBe(before);
    expect(screen.getByRole('tabpanel').querySelectorAll('[data-line]')).toHaveLength(9);
    unmount();
    render(<CodeBlock mode="result" name="maxIndex" code={CODE} initialLanguage="go" t={t} />);
    await waitFor(() => expect(coloredSpans()).toHaveLength(9));
  });

  it.each([
    ['rejects', () => Promise.reject(new Error('boom'))],
    [
      'throws',
      () =>
        Promise.resolve(() => {
          throw new Error('bad');
        }),
    ],
    ['returns the wrong number of lines', () => Promise.resolve(() => [[]])],
  ])('stays plain when the tokenizer %s', async (_n, impl) => {
    mockedLoad.mockImplementation(impl as never);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(select({ highlight: true }));
    await waitFor(() => expect(mockedLoad).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 10));
    expect(coloredSpans()).toHaveLength(0);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not load Shiki with highlight={false}', () => {
    render(select());
    render(
      <CodeBlock
        mode="result"
        name="maxIndex"
        code={CODE}
        initialLanguage="js"
        t={t}
        highlight={false}
      />,
    );
    render(
      <CodeBlock
        mode="preview"
        name="maxIndex"
        code={CODE}
        initialLanguage="js"
        t={t}
        highlight={false}
      />,
    );
    expect(mockedLoad).not.toHaveBeenCalled();
  });
});

describe('CodeBlock disabled (TS-25)', () => {
  it('locks tabs and lines', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onLanguageChange = vi.fn();
    render(select({ disabled: true, initialLanguage: 'js', onSelect, onLanguageChange }));
    for (const tab of screen.getAllByRole('tab'))
      expect(tab).toHaveAttribute('aria-disabled', 'true');
    for (const r of screen.getAllByRole('radio'))
      expect(r).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('tab', { name: 'Java' }));
    screen.getByRole('tab', { name: 'JavaScript' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('radio', { name: /^Línea 3:/ }));
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(onLanguageChange).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('CodeBlock axe (TS-26)', () => {
  it('has no violations in the three modes', async () => {
    const a = render(select({ selected: 4 }));
    expect(await axe(a.container)).toHaveNoViolations();
    a.unmount();
    const b = render(
      <CodeBlock
        mode="result"
        name="maxIndex"
        code={CODE}
        initialLanguage="go"
        t={t}
        highlight={false}
        marks={resultLineMarks(parseResult(RESULT_LOST_GO_ES))}
        markLabel={markLabel}
      />,
    );
    expect(await axe(b.container)).toHaveNoViolations();
    b.unmount();
    const c = render(
      <CodeBlock
        mode="preview"
        name="maxIndex"
        code={CODE}
        initialLanguage="js"
        t={t}
        highlight={false}
        pickable={PICKABLE}
      />,
    );
    expect(await axe(c.container)).toHaveNoViolations();
  });
});
