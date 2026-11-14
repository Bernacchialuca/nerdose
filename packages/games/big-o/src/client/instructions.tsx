import { useEffect, useId, useRef } from 'react';

import { buttonClass, Card } from '@nerdose/ui';

import { HELP_TARGET_ID } from './help-target';
import type { InstructionsProps } from './types';

export function Instructions({
  number,
  t,
  notices,
  onStart,
  starting = false,
  startDisabled = false,
  actions,
}: InstructionsProps) {
  const rulesId = useId();
  const startedRef = useRef(false);
  const blocked = starting || startDisabled;

  useEffect(() => {
    if (!starting) startedRef.current = false;
  }, [starting]);

  const handleStart = () => {
    if (blocked || startedRef.current) return;
    startedRef.current = true;
    onStart();
  };

  const steps = [
    { kicker: t('instructions.step1.kicker'), body: t('instructions.step1.body') },
    { kicker: t('instructions.step2.kicker'), body: t('instructions.step2.body') },
    { kicker: t('instructions.step3.kicker'), body: t('instructions.step3.body') },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-title-game text-game-big-o">{t('title')}</h1>
        <p className="font-mono text-label-comment text-text-dim">
          {t('instructions.meta', { number })}
        </p>
      </div>
      {notices}
      <section id={HELP_TARGET_ID} aria-labelledby={rulesId} className="flex flex-col gap-4">
        <h2 id={rulesId} className="font-mono text-label-comment text-text-dim">
          <span aria-hidden="true">// </span>
          {t('instructions.rulesTitle')}
        </h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
          {steps.map((s) => (
            <li key={s.kicker}>
              <Card variant="step" tone="big-o" kicker={s.kicker} className="h-full">
                {s.body}
              </Card>
            </li>
          ))}
        </ol>
      </section>
      <p className="font-sans text-caption text-text-muted">{t('instructions.countNotice')}</p>
      <div className="flex flex-col items-start gap-3">
        <button
          type="button"
          aria-disabled={blocked || undefined}
          onClick={handleStart}
          className={buttonClass({
            variant: 'accent',
            game: 'big-o',
            size: 'lg',
            disabled: blocked,
          })}
        >
          {t('instructions.start')} <span aria-hidden="true">→</span>
        </button>
        {actions}
      </div>
    </div>
  );
}
