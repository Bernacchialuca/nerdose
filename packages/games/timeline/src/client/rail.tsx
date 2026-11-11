import type { Locale } from '@nerdose/core';
import { cn } from '@nerdose/ui';

import type { TimelineResult } from '../definition/schemas';
import { formatEventDate } from '../shared/format-date';

/** `timeline.rail`: chronological list with the date above the name (fits any precision at 320 px). */
export function Rail({ items, locale }: { items: TimelineResult['items']; locale: Locale }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, i) => (
        <li key={item.opaque_id} className="flex gap-3.5">
          <div aria-hidden="true" className="flex w-5 shrink-0 flex-col items-center">
            <span
              className={cn('h-4 w-0.5', i === 0 ? 'bg-transparent' : 'bg-game-timeline-rail')}
            />
            <span className="size-3 rounded-full bg-game-timeline" />
            <span
              className={cn(
                'w-0.5 grow',
                i === items.length - 1 ? 'bg-transparent' : 'bg-game-timeline-rail',
              )}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1 pt-2.5 pb-4.5">
            <span className="font-mono text-numeric-year text-game-timeline">
              {formatEventDate(item.event_date, item.date_precision, locale)}
            </span>
            <span className="break-words font-mono text-game-item text-text">{item.label}</span>
            <span className="font-sans text-body-sm text-text-lede">{item.note}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
