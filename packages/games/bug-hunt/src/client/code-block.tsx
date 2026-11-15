import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import type { CodeLanguage } from '@nerdose/core';
import { cn } from '@nerdose/ui';

import type { CodeByLanguage } from '../definition/schemas';
import { LANGUAGE_LABEL } from '../shared/labels';

import { fileNames } from './files';
import type { HighlightToken, Tokenizer } from './highlight';
import { codeLines } from './lines';
import type { LineMark } from './marks';
import { moveLine, moveRadio } from './radio';
import { SHIKI_VARS } from './shiki-vars';
import type { Translate } from './types';
import { useTokenizer } from './use-tokenizer';

const LANGUAGES: readonly CodeLanguage[] = ['js', 'go', 'java'];
const TAB_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);

export type MarkLabel = (mark: LineMark) => { glyph: string; text: string };

type CodeBlockProps = {
  /** `select`: the game (eligible lines are radios); `result`: read-only marks; `preview`: admin, plain text. */
  mode: 'select' | 'result' | 'preview';
  /** `function_name`, for the file names and the accessible names. */
  name: string;
  code: CodeByLanguage;
  initialLanguage: CodeLanguage;
  t: Translate;
  pickable?: readonly number[];
  selected?: number | null;
  onSelect?: (line: number) => void;
  marks?: ReadonlyMap<number, LineMark>;
  markLabel?: MarkLabel;
  /** Load Shiki and color the code. The admin preview passes `false` and never loads it. */
  highlight?: boolean;
  /** Locks tabs and lines (a move is in flight). */
  disabled?: boolean;
  onLanguageChange?: (language: CodeLanguage) => void;
  className?: string;
};

/** A tokenizer that throws or returns a different number of lines leaves the block uncolored. */
function safeTokenize(
  tokenizer: Tokenizer | null,
  code: string,
  language: CodeLanguage,
  expectedLines: number,
): HighlightToken[][] | null {
  if (!tokenizer) return null;
  try {
    const tokens = tokenizer(code, language);
    return tokens.length === expectedLines ? tokens : null;
  } catch {
    return null;
  }
}

const MARK_CLASS: Record<LineMark, string> = {
  found: 'bg-status-success-bg shadow-[inset_3px_0_0_var(--color-status-success)]',
  bug: 'bg-game-bug-hunt-tint shadow-bar-bug-hunt',
  wrong: 'bg-status-error-bg shadow-[inset_3px_0_0_var(--color-status-error)]',
};
const MARK_TAG_CLASS: Record<LineMark, string> = {
  found: 'text-status-success',
  bug: 'text-game-bug-hunt',
  wrong: 'text-status-error',
};

/** Code block with language tabs and numbered lines; same tree with or without color. */
export function CodeBlock({
  mode,
  name,
  code,
  initialLanguage,
  t,
  pickable = [],
  selected = null,
  onSelect,
  marks,
  markLabel,
  highlight = true,
  disabled = false,
  onLanguageChange,
  className,
}: CodeBlockProps) {
  const baseId = useId();
  const resetKey = `${initialLanguage}|${code.js}|${code.go}|${code.java}`;
  const [language, setLanguage] = useState(initialLanguage);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const [focusLine, setFocusLine] = useState<number | null>(null);
  const tabRefs = useRef<Partial<Record<CodeLanguage, HTMLButtonElement | null>>>({});
  const lineRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const tokenizer = useTokenizer(highlight);

  // Adjusting state while rendering (React docs): another challenge or initial language restarts the tab.
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setLanguage(initialLanguage);
  }

  const source = code[language];
  const lines = codeLines(source);
  const tokens = useMemo(
    () => safeTokenize(tokenizer, source, language, lines.length),
    [tokenizer, source, language, lines.length],
  );
  const eligible = useMemo(() => [...pickable].sort((a, b) => a - b), [pickable]);
  const languageLabel = LANGUAGE_LABEL[language];
  const panelId = `${baseId}-panel`;
  const tabId = (lang: CodeLanguage) => `${baseId}-tab-${lang}`;
  const interactive = mode === 'select';

  const switchTo = (next: CodeLanguage) => {
    if (disabled || next === language) return;
    setLanguage(next);
    onLanguageChange?.(next);
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!TAB_KEYS.has(event.key)) return;
    event.preventDefault();
    if (disabled) return;
    const next = moveRadio(index, event.key, LANGUAGES.length);
    const target = next === null ? undefined : LANGUAGES[next];
    if (!target) return;
    switchTo(target);
    tabRefs.current[target]?.focus();
  };

  // Roving tabindex: the picked line, else the line that last had focus, else the first eligible one.
  const tabStop =
    selected !== null && eligible.includes(selected)
      ? selected
      : focusLine !== null && eligible.includes(focusLine)
        ? focusLine
        : (eligible.at(0) ?? null);

  const onLineKeyDown = (event: KeyboardEvent<HTMLButtonElement>, line: number) => {
    if (event.key === ' ') {
      event.preventDefault();
      if (!disabled) onSelect?.(line);
      return;
    }
    // Enter belongs to "Confirmar línea"; on a line it must not act as a click.
    if (event.key === 'Enter') {
      event.preventDefault();
      return;
    }
    const next = moveLine(eligible.indexOf(line), event.key, eligible.length);
    if (next === null) return;
    event.preventDefault();
    const target = eligible[next];
    if (target === undefined) return;
    setFocusLine(target);
    lineRefs.current.get(target)?.focus();
  };

  const renderText = (text: string, i: number, colored: boolean) => {
    const lineTokens = colored ? tokens?.[i] : undefined;
    return (
      <span className="whitespace-pre">
        {lineTokens
          ? lineTokens.map((token, k) => (
              <span key={k} style={token.color ? { color: token.color } : undefined}>
                {token.content}
              </span>
            ))
          : text}
      </span>
    );
  };

  const lineNumber = (n: number) => (
    <span
      aria-hidden="true"
      className="w-7.5 flex-none pr-3 text-right font-mono text-meta text-text-dim"
    >
      {n}
    </span>
  );

  const body = lines.map((text, i) => {
    const number = i + 1;
    const rowBase = 'flex w-max min-w-full items-center px-4.5 font-mono text-body leading-loose';

    if (interactive) {
      if (!eligible.includes(number)) {
        return (
          <div key={number} data-line={number} className={cn(rowBase, 'text-text-dim')}>
            {lineNumber(number)}
            <span className="whitespace-pre">{text}</span>
          </div>
        );
      }
      const isSelected = selected === number;
      return (
        <button
          key={number}
          ref={(el) => {
            if (el) lineRefs.current.set(number, el);
            else lineRefs.current.delete(number);
          }}
          data-line={number}
          type="button"
          role="radio"
          aria-checked={isSelected}
          aria-label={t('code.lineLabel', { line: number, code: text.trim() })}
          aria-disabled={disabled || undefined}
          tabIndex={number === tabStop ? 0 : -1}
          onClick={() => {
            if (!disabled) onSelect?.(number);
          }}
          onFocus={() => setFocusLine(number)}
          onKeyDown={(e) => onLineKeyDown(e, number)}
          className={cn(
            rowBase,
            'min-h-10 text-left text-text hover:bg-game-bug-hunt-tint-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-game-bug-hunt',
            isSelected && 'bg-game-bug-hunt-tint shadow-bar-bug-hunt',
          )}
        >
          {lineNumber(number)}
          {renderText(text, i, true)}
          {isSelected ? (
            <span
              aria-hidden="true"
              className="sticky right-0 ml-auto bg-game-bug-hunt-tint pl-3 font-mono text-meta-strong text-game-bug-hunt"
            >
              ◀<span className="hidden @lg:inline"> {t('code.chosenTag')}</span>
            </span>
          ) : null}
        </button>
      );
    }

    // result / preview: read-only; marked lines carry a tag tied to the line with aria-describedby.
    const mark = marks?.get(number);
    const tag = mark && markLabel ? markLabel(mark) : null;
    const tagId = `${baseId}-tag-${number}`;
    const dim = mode === 'preview' && !eligible.includes(number) && mark === undefined;
    return (
      <div
        key={number}
        data-line={number}
        aria-describedby={tag ? tagId : undefined}
        className={cn(
          rowBase,
          'flex-wrap @lg:flex-nowrap',
          dim ? 'text-text-dim' : 'text-text',
          mark && MARK_CLASS[mark],
        )}
      >
        {lineNumber(number)}
        {renderText(text, i, mode === 'result' || !dim)}
        {mark && tag ? (
          <span
            id={tagId}
            className={cn(
              'basis-full pl-12 font-mono text-meta-strong @lg:ml-auto @lg:flex-none @lg:basis-auto @lg:pl-5',
              MARK_TAG_CLASS[mark],
            )}
          >
            <span aria-hidden="true">{tag.glyph}</span> {tag.text}
          </span>
        ) : null}
      </div>
    );
  });

  const regionLabel = t('code.regionLabel', { name, language: languageLabel });

  return (
    <div
      style={SHIKI_VARS}
      className={cn(
        '@container overflow-hidden rounded-panel border border-border bg-surface-sunken',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border-subtle bg-toolbar p-2">
        <div role="tablist" aria-label={t('code.tabsLabel')} className="flex flex-wrap gap-1">
          {LANGUAGES.map((lang, index) => {
            const isSelected = lang === language;
            return (
              <button
                key={lang}
                ref={(el) => {
                  tabRefs.current[lang] = el;
                }}
                id={tabId(lang)}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={panelId}
                aria-disabled={disabled || undefined}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => switchTo(lang)}
                onKeyDown={(e) => onTabKeyDown(e, index)}
                className={cn(
                  'min-h-10 rounded-tile px-4 font-mono text-label-comment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-game-bug-hunt',
                  isSelected
                    ? 'bg-game-bug-hunt-tint-strong font-bold text-game-bug-hunt'
                    : 'text-text-muted hover:text-text',
                )}
              >
                {LANGUAGE_LABEL[lang]}
              </button>
            );
          })}
        </div>
        <span className="px-2.5 font-mono text-meta text-text-dim">
          {fileNames(name)[language]}
        </span>
      </div>
      {interactive ? (
        <div
          id={panelId}
          role="tabpanel"
          aria-label={regionLabel}
          style={{ tabSize: 4 }}
          className="overflow-x-auto py-3.5"
        >
          <div
            role="radiogroup"
            aria-label={t('code.linesLabel', { name, language: languageLabel })}
          >
            {body}
          </div>
        </div>
      ) : (
        <div
          id={panelId}
          role="tabpanel"
          aria-label={regionLabel}
          style={{ tabSize: 4 }}
          tabIndex={0}
          className="overflow-x-auto py-3.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-game-bug-hunt"
        >
          {body}
        </div>
      )}
    </div>
  );
}
