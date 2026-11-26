import { Banner } from '@nerdose/ui';

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

  // Main column (7/12): your order and the host's closing card. Aside (5/12): the correct order
  // and the host's aside slot, last. On mobile the DOM order is the reading order.
  return (
    <div className="flex flex-col gap-6">
      <Banner
        variant={r.win ? 'success' : 'failure'}
        titleAs="h1"
        title={t(verdictKey(r.score))}
        action={<Score score={r.score} t={t} />}
      >
        {r.win ? t('result.wonDetail') : t('result.lostDetail')}
      </Banner>
      {notices}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          <SectionPanel title={t('result.yourOrder')}>
            <YourOrder marks={marks} t={t} />
          </SectionPanel>
          {footer}
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
          <SectionPanel title={t('result.correctOrder')}>
            <Rail items={r.items} locale={locale} t={t} />
          </SectionPanel>
          {aside}
        </div>
      </div>
    </div>
  );
}
