import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { cn } from '../cn';
import { FOCUS_RING } from './focus';
import {
  buildHeatmap,
  formatHeatmapDay,
  heatmapLevel,
  monthLabels,
  moveHeatmapDate,
} from './heatmap-model';
import type { HeatmapDay, HeatmapDayInfo } from './heatmap-model';

export type HeatmapProps = {
  today: string;
  days: readonly HeatmapDay[];
  locale: string;
  caption: ReactNode;
  summaryLabel: (total: number) => string;
  cellLabel: (day: HeatmapDayInfo) => string;
  detailLabel: (day: HeatmapDayInfo) => string;
  emptyDetail: string;
  className?: string;
};

const LEVEL_CLASS = [
  'bg-heatmap-0',
  'bg-heatmap-1',
  'bg-heatmap-2',
  'bg-heatmap-3',
  'bg-heatmap-4',
] as const;

const LEGEND = Array.from({ length: 6 }, (_, n) => n);
const ROWS = Array.from({ length: 7 }, (_, r) => r);

export function Heatmap({
  today,
  days,
  locale,
  caption,
  summaryLabel,
  cellLabel,
  detailLabel,
  emptyDetail,
  className,
}: HeatmapProps) {
  const model = useMemo(() => buildHeatmap(today, days), [today, days]);
  const months = useMemo(() => monthLabels(model.weeks, locale), [model.weeks, locale]);
  const [selected, setSelected] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [today]);

  const active = selected !== null && model.byDate.has(selected) ? selected : today;

  const info = (date: string): HeatmapDayInfo => {
    const cell = model.byDate.get(date);
    return {
      date,
      completed: cell?.completed ?? 0,
      isToday: date === today,
      ...formatHeatmapDay(date, locale),
    };
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const next = moveHeatmapDate(active, event.key, model.start, today);
    if (next === null) return;
    event.preventDefault();
    buttons.current.get(next)?.focus();
  };

  const monthByWeek = new Map(months.map((m) => [m.week, m.label]));
  const detail = model.total === 0 && selected === null ? emptyDetail : detailLabel(info(active));

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <p className="font-mono text-meta text-text-dim">{caption}</p>
      <div ref={scrollRef} className="overflow-x-auto">
        <div className="flex w-max flex-col gap-1 p-1">
          <div aria-hidden="true" className="flex gap-1">
            {model.weeks.map((_, w) => (
              <span
                key={w}
                className="w-3.5 shrink-0 whitespace-nowrap font-mono text-micro text-text-dim"
              >
                {monthByWeek.get(w)}
              </span>
            ))}
          </div>
          <div role="grid" aria-label={summaryLabel(model.total)} className="flex flex-col gap-1">
            {ROWS.map((r) => (
              <div key={r} role="row" className="flex gap-1">
                {model.weeks.map((week, w) => {
                  const cell = week.cells[r];
                  if (!cell) {
                    return <span key={w} aria-hidden="true" className="size-3.5 shrink-0" />;
                  }
                  return (
                    <div key={w} role="gridcell" className="size-3.5 shrink-0">
                      <button
                        ref={(el) => {
                          if (el) buttons.current.set(cell.date, el);
                          else buttons.current.delete(cell.date);
                        }}
                        type="button"
                        aria-label={cellLabel(info(cell.date))}
                        aria-current={cell.isToday ? 'date' : undefined}
                        tabIndex={cell.date === active ? 0 : -1}
                        onFocus={() => {
                          setSelected(cell.date);
                        }}
                        onClick={() => {
                          setSelected(cell.date);
                        }}
                        onKeyDown={onKeyDown}
                        className={cn(
                          'block size-3.5 rounded-micro',
                          LEVEL_CLASS[cell.level],
                          FOCUS_RING,
                          cell.isToday && 'ring-1 ring-border-interactive',
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="flex items-center gap-1.5 font-mono text-micro text-text-dim"
      >
        {LEGEND.map((n) => (
          <span key={n} className="flex items-center gap-1.5">
            {n}
            <span className={cn('size-3 rounded-micro', LEVEL_CLASS[heatmapLevel(n)])} />
          </span>
        ))}
      </div>
      <p className="font-mono text-caption text-text-muted">{detail}</p>
    </div>
  );
}
