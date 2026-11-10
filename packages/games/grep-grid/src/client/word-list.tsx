import { cn } from '@nerdose/ui';

import { SectionPanel } from './section-panel';
import type { Translate } from './types';

export type WordRow = {
  term_id: string;
  word: string;
  definition?: string;
  status: 'pending' | 'found' | 'revealed';
};

const ROW_CLASS = {
  pending: 'border-surface-inset bg-surface-inset',
  found: 'border-game-grep-grid-featured bg-game-grep-grid-found-bg',
  revealed: 'border-surface-inset bg-surface-inset',
} as const;

const NAME_CLASS = {
  pending: 'text-text',
  found: 'text-game-grep-grid-light line-through',
  revealed: 'text-text',
} as const;

export function WordList({
  rows,
  mode,
  t,
}: {
  rows: WordRow[];
  mode: 'play' | 'result';
  t: Translate;
}) {
  return (
    <SectionPanel title={t('words.title')}>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.term_id}
            className={cn(
              'flex flex-col gap-1 rounded-control border px-3 py-2.5',
              ROW_CLASS[row.status],
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn('font-mono text-mono-unit-compact font-bold', NAME_CLASS[row.status])}
              >
                {row.word}
              </span>
              <Tag row={row} mode={mode} t={t} />
            </div>
            {row.status !== 'pending' && row.definition ? (
              <p className="font-sans text-caption text-text-body">{row.definition}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </SectionPanel>
  );
}

function Tag({ row, mode, t }: { row: WordRow; mode: 'play' | 'result'; t: Translate }) {
  if (row.status === 'found') {
    return mode === 'result' ? (
      <span className="font-mono text-meta font-extrabold text-game-grep-grid">
        {t('words.foundResult')}
      </span>
    ) : (
      <span className="font-mono text-meta font-extrabold text-game-grep-grid">
        <span aria-hidden="true">✓</span>
        <span className="sr-only">{t('words.foundSr')}</span>
      </span>
    );
  }
  if (row.status === 'revealed') {
    return <span className="font-mono text-meta text-text-dim">{t('words.revealed')}</span>;
  }
  return (
    <span className="font-mono text-meta text-text-dim">
      {t('words.letters', { count: row.word.length })}
    </span>
  );
}
