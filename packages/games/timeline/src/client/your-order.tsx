import { Badge, cn } from '@nerdose/ui';

import type { PositionMark } from './marks';
import type { Translate } from './types';

/** `timeline.row` in its result states: correct (solid green) or misplaced (dashed amber, never red). */
export function YourOrder({ marks, t }: { marks: PositionMark[]; t: Translate }) {
  return (
    <ol className="flex flex-col gap-2">
      {marks.map((m) => (
        <li
          key={m.opaque_id}
          className={cn(
            'flex min-h-13 items-center gap-3 rounded-control border px-3.5 py-2',
            m.correct
              ? 'border-status-success-border bg-status-success-row-bg'
              : 'border-dashed border-status-misplaced-border bg-status-misplaced-bg',
          )}
        >
          <span className="sr-only">
            {m.correct
              ? t('result.rowOk', { label: m.label, position: m.position })
              : t('result.rowWrong', {
                  label: m.label,
                  position: m.position,
                  correct: m.correctPosition,
                })}
          </span>
          <span aria-hidden="true" className="contents">
            <span className="w-4.5 shrink-0 font-mono text-label-comment text-text-dim">
              {m.position}
            </span>
            <span className="flex min-w-0 grow flex-wrap items-center gap-x-3 gap-y-1">
              <span className="min-w-0 grow break-words font-mono text-game-item text-text">
                {m.label}
              </span>
              <Badge tone={m.correct ? 'success' : 'pending'} strong>
                {m.correct ? t('result.ok') : t('result.goesIn', { position: m.correctPosition })}
              </Badge>
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
