import { cn } from '../cn';

import type { UiGameId } from './game-classes';

export type GameThumbnailProps = { game: UiGameId; className?: string };

const DEVDLE_CELLS = [
  'empty',
  'present',
  'correct',
  'empty',
  'correct',
  'empty',
  'correct',
  'correct',
  'correct',
  'correct',
  'correct',
  'correct',
] as const;

const DEVDLE_CELL_CLASS = {
  empty: 'border-2 border-game-devdle-muted',
  present: 'border-2 border-dashed border-status-pending',
  correct: 'bg-game-devdle',
} as const;

const BUG_LINES = [
  { n: 1, indent: null, bar: 'w-7/12', bug: false },
  { n: 2, indent: 'w-4', bar: 'w-2/5', bug: false },
  { n: 3, indent: 'w-8', bar: 'w-6/13', bug: true },
  { n: 4, indent: 'w-12', bar: 'w-2/7', bug: false },
  { n: 5, indent: null, bar: 'w-1/3', bug: false },
] as const;

const BIG_O_CHIPS = ['O(1)', 'O(log n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'] as const;

const TIMELINE_NODES = [
  { key: 'a', year: '1991', placed: true },
  { key: 'b', year: '1995', placed: true },
  { key: 'c', year: '????', placed: false },
  { key: 'd', year: '????', placed: false },
  { key: 'e', year: '????', placed: false },
] as const;

type GrepKind = 'plain' | 'found' | 'selected';
const GREP_ROWS: readonly (readonly [string, GrepKind][])[] = [
  [
    ['V', 'plain'],
    ['F', 'plain'],
    ['S', 'plain'],
    ['M', 'found'],
    ['U', 'found'],
    ['T', 'found'],
    ['E', 'found'],
  ],
  [
    ['I', 'plain'],
    ['B', 'plain'],
    ['D', 'plain'],
    ['W', 'plain'],
    ['E', 'selected'],
    ['C', 'plain'],
    ['C', 'plain'],
  ],
  [
    ['I', 'plain'],
    ['H', 'plain'],
    ['I', 'plain'],
    ['E', 'plain'],
    ['D', 'plain'],
    ['R', 'selected'],
    ['U', 'plain'],
  ],
  [
    ['F', 'plain'],
    ['I', 'plain'],
    ['R', 'plain'],
    ['F', 'plain'],
    ['P', 'plain'],
    ['W', 'plain'],
    ['G', 'selected'],
  ],
];

const GREP_CELL_CLASS: Record<GrepKind, string> = {
  plain: 'size-5.5 text-game-grep-grid-muted',
  found: 'size-5.5 rounded-cell-xs bg-game-grep-grid text-game-grep-grid-on',
  selected:
    'size-5.5 rounded-cell-xs border border-game-grep-grid leading-5 text-game-grep-grid-light',
};

export function GameThumbnail({ game, className }: GameThumbnailProps) {
  if (game === 'devdle') {
    return (
      <div aria-hidden="true" className={cn('grid grid-cols-6 gap-1.25 font-mono', className)}>
        {DEVDLE_CELLS.map((kind, i) => (
          <div key={i} className={cn('size-7.5 rounded-cell-sm', DEVDLE_CELL_CLASS[kind])} />
        ))}
      </div>
    );
  }

  if (game === 'bug-hunt') {
    return (
      <div
        aria-hidden="true"
        className={cn('flex w-full flex-col gap-1.75 px-6 font-mono', className)}
      >
        {BUG_LINES.map((line) => (
          <div
            key={line.n}
            className={cn(
              'flex items-center gap-2.5',
              line.bug &&
                '-mx-2.5 rounded-cell-md bg-game-bug-hunt-tint-strong px-2.5 py-1 shadow-bar-bug-hunt',
            )}
          >
            <span
              className={cn(
                'w-3 flex-none text-micro-xs',
                line.bug ? 'text-game-bug-hunt' : 'text-game-bug-hunt-muted',
              )}
            >
              {line.n}
            </span>
            {line.indent ? <span className={cn('flex-none', line.indent)} /> : null}
            <span
              className={cn(
                'h-2 rounded-full',
                line.bar,
                line.bug ? 'bg-game-bug-hunt' : 'bg-game-bug-hunt-muted-bar',
              )}
            />
            {line.bug ? <span className="ml-auto text-label-comment">🐛</span> : null}
          </div>
        ))}
      </div>
    );
  }

  if (game === 'big-o') {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'flex flex-wrap content-center justify-center gap-2 px-5 font-mono',
          className,
        )}
      >
        {BIG_O_CHIPS.map((chip) => (
          <span
            key={chip}
            className={cn(
              'rounded-tile border px-3 py-1.5 text-label-comment',
              chip === 'O(n log n)'
                ? 'border-game-big-o bg-game-big-o font-bold text-game-big-o-on'
                : 'border-game-big-o-chip-border text-game-big-o-muted',
            )}
          >
            {chip}
          </span>
        ))}
      </div>
    );
  }

  if (game === 'timeline') {
    return (
      <div aria-hidden="true" className={cn('w-full px-5.5 font-mono', className)}>
        <div className="relative flex w-full items-center justify-between">
          <span className="absolute inset-x-0 top-1/2 h-0.5 bg-game-timeline-rail" />
          {TIMELINE_NODES.map((node) => (
            <div key={node.key} className="relative flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'size-3.5 rounded-full',
                  node.placed
                    ? 'bg-game-timeline'
                    : 'border-2 border-game-timeline bg-game-timeline-tint',
                )}
              />
              <span className="text-micro text-game-timeline-muted">{node.year}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid grid-cols-7 gap-1 text-center font-mono text-meta-strong leading-5.5',
        className,
      )}
    >
      {GREP_ROWS.flatMap((row, r) =>
        row.map(([letter, kind], c) => (
          <span key={`${r}-${c}`} className={GREP_CELL_CLASS[kind]}>
            {letter}
          </span>
        )),
      )}
    </div>
  );
}
