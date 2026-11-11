import { ITEMS_COUNT } from '../definition/schemas';

import { positionMarks } from './marks';
import { parseResult } from './parse';
import { Rail } from './rail';
import { Score } from './score';
import { SectionPanel } from './section-panel';
import type { ResultProps } from './types';
import { YourOrder } from './your-order';

export function Result({ locale, t, notices, result, aside, footer }: ResultProps) {
  const r = parseResult(result);
  const marks = positionMarks(r);
  const verdict =
    r.score === ITEMS_COUNT
      ? t('result.won')
      : r.score === 0
        ? t('result.zero')
        : t('result.partial', { score: r.score, total: ITEMS_COUNT });

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
            {verdict}
          </h1>
        </div>
        <Score score={r.score} t={t} />
      </div>
      {notices}
      <div className="flex flex-wrap gap-6">
        <div className="min-w-0 grow basis-80">
          <SectionPanel title={t('result.yourOrder')}>
            <YourOrder marks={marks} t={t} />
          </SectionPanel>
        </div>
        <div className="min-w-0 grow-2 basis-130">
          <SectionPanel title={t('result.correctOrder')}>
            <Rail items={r.items} locale={locale} t={t} />
          </SectionPanel>
        </div>
      </div>
      {aside || footer ? (
        <div className="flex flex-wrap gap-6">
          {aside ? <div className="min-w-0 grow basis-80">{aside}</div> : null}
          {footer ? <div className="min-w-0 grow-2 basis-130">{footer}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
