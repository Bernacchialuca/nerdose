import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import type { CodeLanguage } from '@nerdose/core';
import { cn } from '@nerdose/ui';

import type { CodeByLanguage } from '../definition/schemas';
import { LANGUAGE_LABEL } from '../shared/labels';

import type { HighlightToken, Tokenizer } from './highlight';
import { codeLines, notesByLine } from './lines';
import { moveRadio } from './radio';
import { SHIKI_VARS } from './shiki-vars';
import type { Translate } from './types';
import { useTokenizer } from './use-tokenizer';

const LANGUAGES: readonly CodeLanguage[] = ['js', 'go', 'java'];
const FILENAME: Record<CodeLanguage, string> = { js: 'f.js', go: 'f.go', java: 'F.java' };
const TAB_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);

type CodeBlockProps = {
  code: CodeByLanguage;
  initialLanguage: CodeLanguage;
  t: Translate;
  notes?: readonly { line: number; text: string }[];
  /** Load Shiki and color the code. The admin preview passes `false` and never loads it. */
  highlight?: boolean;
  /** Locks the tabs (a move is in flight). */
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

/** Read-only code block: language tabs, numbered lines and per-line notes. Same tree with or without color. */
export function CodeBlock({
  code,
  initialLanguage,
  t,
  notes = [],
  highlight = true,
  disabled = false,
  onLanguageChange,
  className,
}: CodeBlockProps) {
  const baseId = useId();
  const resetKey = `${initialLanguage}|${code.js}|${code.go}|${code.java}`;
  const [language, setLanguage] = useState(initialLanguage);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const tabRefs = useRef<Partial<Record<CodeLanguage, HTMLButtonElement | null>>>({});
  const tokenizer = useTokenizer(highlight);

  // Adjusting state while rendering (React docs): another challenge or initial language restarts the tab.
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setLanguage(initialLanguage);
  }

  const source = code[language];
  const lines = codeLines(source);
  const noteOf = useMemo(() => notesByLine(notes), [notes]);
  const tokens = useMemo(
    () => safeTokenize(tokenizer, source, language, lines.length),
    [tokenizer, source, language, lines.length],
  );
  const panelId = `${baseId}-panel`;
  const tabId = (lang: CodeLanguage) => `${baseId}-tab-${lang}`;

  const select = (next: CodeLanguage) => {
    if (disabled || next === language) return;
    setLanguage(next);
    onLanguageChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!TAB_KEYS.has(event.key)) return;
    event.preventDefault();
    if (disabled) return;
    const next = moveRadio(index, event.key, LANGUAGES.length);
    const target = next === null ? undefined : LANGUAGES[next];
    if (!target) return;
    select(target);
    tabRefs.current[target]?.focus();
  };

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
            const selected = lang === language;
            return (
              <button
                key={lang}
                ref={(el) => {
                  tabRefs.current[lang] = el;
                }}
                id={tabId(lang)}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                aria-disabled={disabled || undefined}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(lang)}
                onKeyDown={(e) => onKeyDown(e, index)}
                className={cn(
                  'min-h-11 rounded-tile px-4 font-mono text-label-comment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  selected
                    ? 'bg-game-big-o-border font-bold text-text'
                    : 'text-text-muted hover:text-text',
                )}
              >
                {LANGUAGE_LABEL[lang]}
              </button>
            );
          })}
        </div>
        <span className="px-2.5 font-mono text-meta text-text-dim">{FILENAME[language]}</span>
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-label={t('code.regionLabel', { language: LANGUAGE_LABEL[language] })}
        tabIndex={0}
        style={{ tabSize: 4 }}
        className="overflow-x-auto py-4.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        {lines.map((text, i) => {
          const number = i + 1;
          const note = noteOf.get(number);
          const noteId = `${baseId}-note-${number}`;
          const lineTokens = tokens?.[i];
          return (
            <div
              key={number}
              data-line={number}
              aria-describedby={note === undefined ? undefined : noteId}
              className={cn(
                'flex w-max min-w-full flex-wrap items-center px-4.5 font-mono text-body leading-loose text-text @lg:flex-nowrap',
                note !== undefined &&
                  'bg-game-big-o-tint shadow-[inset_3px_0_0_var(--color-game-big-o)]',
              )}
            >
              <span aria-hidden="true" className="w-7.5 flex-none text-text-dim">
                {number}
              </span>
              <span className="whitespace-pre">
                {lineTokens
                  ? lineTokens.map((token, k) => (
                      <span key={k} style={token.color ? { color: token.color } : undefined}>
                        {token.content}
                      </span>
                    ))
                  : text}
              </span>
              {note === undefined ? null : (
                <span
                  id={noteId}
                  className="basis-full pl-12 font-mono text-meta text-game-big-o-light @lg:ml-auto @lg:basis-auto @lg:pl-5 @lg:flex-none"
                >
                  {note}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
