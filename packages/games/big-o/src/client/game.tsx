import { useEffect, useId, useRef, useState } from 'react';

import type { BigOOption, CodeLanguage } from '@nerdose/core';
import { buttonClass } from '@nerdose/ui';

import { moveSchema } from '../definition/schemas';
import { OPTION_LABEL } from '../shared/labels';

import { CodeBlock } from './code-block';
import { ConsoleHint, type HintAnnouncement } from './console-hint';
import { HELP_TARGET_ID } from './help-target';
import { OptionsGroup } from './options-group';
import { parsePublicView, parseState } from './parse';
import { Question } from './question';
import { SectionPanel } from './section-panel';
import type { GameProps } from './types';

type Hint =
  | { key: 'idle' | 'invalidMove' | 'rateLimited' }
  | { key: 'selected'; option: BigOOption }
  | { key: 'message'; message: string };

const IDLE: Hint = { key: 'idle' };
const RULES = ['game.rule1', 'game.rule2', 'game.rule3'];

export function Game({
  t,
  notices,
  codeLanguage,
  publicView,
  state,
  onMove,
  pending,
  moveError,
  locked = false,
  aside,
}: GameProps) {
  const view = parsePublicView(publicView);
  parseState(state);

  const startLanguage: CodeLanguage = codeLanguage ?? 'js';
  const codeKey = `${view.code.js}\u0000${view.code.go}\u0000${view.code.java}`;
  const [selected, setSelected] = useState<BigOOption | null>(null);
  const [language, setLanguage] = useState<CodeLanguage>(startLanguage);
  const [initialLanguage, setInitialLanguage] = useState<CodeLanguage>(startLanguage);
  const [prevCodeKey, setPrevCodeKey] = useState(codeKey);
  const [hint, setHint] = useState<Hint>(IDLE);
  const [announcement, setAnnouncement] = useState<HintAnnouncement | null>(null);
  const [prevError, setPrevError] = useState(moveError);
  const submittedRef = useRef(false);
  const optionsTitleId = useId();

  const text = (h: Hint): string => {
    switch (h.key) {
      case 'idle':
        return t('game.hint.idle');
      case 'selected':
        return t('game.hint.selected', { option: OPTION_LABEL[h.option] });
      case 'message':
        return t('game.hint.message', { message: h.message });
      default:
        return t(`game.hint.${h.key}`);
    }
  };
  const announce = (h: Hint) => setAnnouncement({ id: (announcement?.id ?? 0) + 1, text: text(h) });

  // Adjusting state while rendering (React docs): another challenge restarts selection, tab and hint;
  // a language change keeps the same code and so keeps the local selection and tab.
  if (codeKey !== prevCodeKey) {
    setPrevCodeKey(codeKey);
    setSelected(null);
    setLanguage(startLanguage);
    setInitialLanguage(startLanguage);
    setHint(IDLE);
    setAnnouncement(null);
  }
  if (moveError !== prevError) {
    setPrevError(moveError);
    if (moveError) {
      const next: Hint =
        moveError.code === 'invalid_move'
          ? { key: 'invalidMove' }
          : moveError.code === 'rate_limited'
            ? { key: 'rateLimited' }
            : { key: 'message', message: moveError.message };
      setHint(next);
      announce(next);
    }
  }

  // A rejected or finished submit re-arms "Confirmar respuesta".
  useEffect(() => {
    if (!pending) submittedRef.current = false;
  }, [pending, moveError]);

  const select = (option: BigOOption) => {
    if (pending) return;
    setSelected(option);
    const h: Hint = { key: 'selected', option };
    setHint(h);
    announce(h);
  };

  const confirm = () => {
    if (selected === null || pending || submittedRef.current) return;
    submittedRef.current = true;
    onMove(moveSchema.parse({ language, option: selected }));
  };

  const header = (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-label-comment text-text-dim">
        <span aria-hidden="true">// </span>
        {t('game.comment')}
      </p>
      <Question t={t} as="h1" />
    </div>
  );

  if (locked) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        {notices}
        {aside}
      </div>
    );
  }

  const noSelection = selected === null;
  const confirmLabel = pending
    ? t('game.confirming')
    : noSelection
      ? t('game.confirmIdle')
      : t('game.confirm');
  // Two real columns: in mobile the main one (code, options, CTA) comes first, then the side one.
  return (
    <div className="flex flex-col gap-6">
      {header}
      {notices}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          <CodeBlock
            key={codeKey}
            code={view.code}
            initialLanguage={initialLanguage}
            t={t}
            disabled={pending}
            onLanguageChange={setLanguage}
          />
          <h2 id={optionsTitleId} className="font-mono text-label-comment text-text-dim">
            <span aria-hidden="true">// </span>
            {t('game.optionsTitle')}
          </h2>
          <OptionsGroup
            options={view.options}
            selected={selected}
            onSelect={select}
            disabled={pending}
            t={t}
          />
          <ConsoleHint text={text(hint)} announcement={announcement} />
          <button
            type="button"
            aria-disabled={noSelection || pending || undefined}
            onClick={confirm}
            className={buttonClass({
              variant: 'accent',
              game: 'big-o',
              size: 'lg',
              fullWidth: true,
              disabled: noSelection || pending,
            })}
          >
            {confirmLabel}
            {noSelection || pending ? null : <span aria-hidden="true"> →</span>}
          </button>
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
          <SectionPanel id={HELP_TARGET_ID} title={t('game.rulesTitle')}>
            <ol className="flex flex-col gap-3">
              {RULES.map((key, i) => (
                <li key={key} className="flex gap-3">
                  <span className="shrink-0 font-mono text-label-comment text-game-big-o">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-sans text-body-sm text-text-body">{t(key)}</span>
                </li>
              ))}
            </ol>
            <p className="font-sans text-caption text-text-muted">{t('game.help')}</p>
          </SectionPanel>
          {aside}
        </div>
      </div>
    </div>
  );
}
