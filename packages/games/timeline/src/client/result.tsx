import { ITEMS_COUNT } from '../definition/schemas';

import { positionMarks } from './marks';
import { parseResult } from './parse';
import { Rail } from './rail';
import { Score } from './score';
import { SectionPanel } from './section-panel';
import type { ResultProps } from './types';
import { YourOrder } from './your-order';

/**
 * Verdict phrase. The score is already shown by `Score`, so the title does not repeat it. With 5
 * milestones a 4/5 cannot happen (if 4 are in place, so is the fifth); 3/5 is exactly one swap.
 */
const verdictKey = (score: number): string => {
  if (score >= ITEMS_COUNT) return 'result.won';
  if (score >= 3) return 'result.verdict3';
  return `result.verdict${Math.max(0, score)}`;
};

export function Result({ locale, t, notices, result, aside, footer }: ResultProps) {
  const r = parseResult(result);
  const marks = positionMarks(r);

  // Mobile: title, your order, correct order and the host's closing card, in one column.
  // Desktop: your order with the closing card below it on the left (5/12), the rail on the right
  // (7/12). `contents` + `order` build the mobile column from the desktop DOM.
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex min-w-0 grow-2 basis-130 flex-col gap-2">
          <p className="font-mono text-label-comment text-text-dim">
            {`// ${t('result.comment')}`}
          </p>
          <h1 className="font-mono text-title-game text-text">
            {r.win ? (
              <span aria-hidden="true" className="text-status-success">
                ✓{' '}
              </span>
            ) : null}
            {t(verdictKey(r.score))}
          </h1>
        </div>
        <Score score={r.score} t={t} />
      </div>
      {notices}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start">
        <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-6">
          <div className="order-1 min-w-0 lg:order-none">
            <SectionPanel title={t('result.yourOrder')}>
              <YourOrder marks={marks} t={t} />
            </SectionPanel>
          </div>
          {aside ? <div className="order-3 min-w-0 lg:order-none">{aside}</div> : null}
          {footer ? <div className="order-4 min-w-0 lg:order-none">{footer}</div> : null}
        </div>
        <div className="order-2 min-w-0 lg:order-none lg:col-span-7">
          <SectionPanel title={t('result.correctOrder')}>
            <Rail items={r.items} locale={locale} t={t} />
          </SectionPanel>
        </div>
      </div>
    </div>
  );
}
