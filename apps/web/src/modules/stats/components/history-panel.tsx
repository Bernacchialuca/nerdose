import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Locale } from '@nerdose/core';
import { Alert, Panel, buttonClass, cn, dataTableClass } from '@nerdose/ui';

import type { StatsHistoryEntry } from '../api/my-stats';
import { formatShortDate } from '../format';

export type LoadMoreResult = {
  data?: { pages: { history: unknown[] }[] } | undefined;
  hasNextPage?: boolean;
  isError?: boolean;
};

export type HistoryPanelProps = {
  rows: StatsHistoryEntry[];
  locale: Locale;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: boolean;
  onLoadMore: () => Promise<LoadMoreResult>;
};

export function HistoryPanel({
  rows,
  locale,
  hasMore,
  loadingMore,
  loadMoreError,
  onLoadMore,
}: HistoryPanelProps) {
  const { t } = useTranslation();
  const table = dataTableClass();
  const [announcement, setAnnouncement] = useState('');
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const focused = useRef<number | null>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const rowRefs = useRef(new Map<number, HTMLTableRowElement>());

  useEffect(() => {
    if (focusIndex === null || rows.length <= focusIndex || focused.current === focusIndex) return;
    focused.current = focusIndex;
    rowRefs.current.get(focusIndex)?.focus();
  }, [focusIndex, rows.length]);

  const loadMore = async () => {
    if (loadingMore) return;
    const previous = rows.length;
    const res = await onLoadMore();
    if (res.isError) return;
    const added = res.data?.pages.at(-1)?.history.length ?? 0;
    setAnnouncement(t('stats.history.added', { count: added }));
    if (res.hasNextPage) {
      moreRef.current?.focus();
    } else {
      setFocusIndex(previous);
    }
  };

  const th = cn(table.th);
  return (
    <Panel title={t('stats.history.title')}>
      {/* DS data-table: la región con scroll horizontal es alcanzable con teclado (tabIndex 0 + nombre). */}
      <div
        role="region"
        aria-label={t('stats.history.caption')}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className={cn(table.region, '@container')}
      >
        <table className={cn(table.table, 'min-w-0 @2xl:min-w-160')}>
          <caption className="sr-only">{t('stats.history.caption')}</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>
                {t('stats.history.date')}
              </th>
              <th scope="col" className={cn(th, 'hidden @2xl:table-cell')}>
                {t('stats.history.number')}
              </th>
              <th scope="col" className={th}>
                {t('stats.history.game')}
              </th>
              <th scope="col" className={th}>
                {t('stats.history.result')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className={table.td}>
                  {t('stats.history.empty')}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={`${row.date}-${row.game_id}-${row.number}`}
                  tabIndex={-1}
                  ref={(el) => {
                    if (el) rowRefs.current.set(i, el);
                  }}
                >
                  <th scope="row" className={cn(table.td, 'font-normal text-left')}>
                    {formatShortDate(row.date, locale)}
                    <span className="@2xl:hidden">
                      {' · '}
                      {t('stats.history.challenge', { number: row.number })}
                    </span>
                  </th>
                  <td className={cn(table.td, 'hidden @2xl:table-cell')}>
                    {t('stats.history.challenge', { number: row.number })}
                  </td>
                  <td className={table.td}>{t(`games.${row.game_id}.name`)}</td>
                  <td className={table.td}>
                    {row.status === 'voided' ? (
                      t('stats.history.status.voided')
                    ) : (
                      <>
                        <span className="sr-only @2xl:not-sr-only">
                          {t(`stats.history.status.${row.status}`)}
                          {' · '}
                        </span>
                        {row.label}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {loadMoreError ? <Alert>{t('stats.history.moreError')}</Alert> : null}
      {hasMore ? (
        <button
          ref={moreRef}
          type="button"
          aria-disabled={loadingMore || undefined}
          onClick={() => void loadMore()}
          className={cn(
            buttonClass({ variant: 'secondary', size: 'md', disabled: loadingMore }),
            'w-full @2xl:w-auto @2xl:self-center',
          )}
        >
          <span aria-hidden="true">⌄</span>{' '}
          {loadingMore ? t('stats.history.loadingMore') : t('stats.history.more')}
        </button>
      ) : null}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </Panel>
  );
}
