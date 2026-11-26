import { useId } from 'react';

import { GAME_IDS } from '@nerdose/core';
import { Panel, cn, dataTableClass } from '@nerdose/ui';

import { Pagination, usePagination } from '@/components/pagination';
import { TableRegion } from '@/components/table-region';
import { formatDay } from '@/lib/format-date';
import { formatCount } from '@/lib/format-number';
import { GAME_LABELS } from '@/modules/reports';

import type { DailyPlayersRow } from '../api/types';
import { METRICS_PAGE_SIZE, NOTES, dailyRows } from '../metrics-model';
import { EmptyRow } from './empty-row';

type Props = { daily: DailyPlayersRow[]; from: string; to: string };

export function DailyPlayersTable({ daily, from, to }: Props) {
  const noteId = useId();
  const c = dataTableClass();
  const rows = dailyRows(daily, from, to);
  const pages = usePagination(rows, METRICS_PAGE_SIZE);
  const columns = ['Fecha', 'Total', ...GAME_IDS.map((g) => GAME_LABELS[g])];
  return (
    <Panel title="Jugadores diarios">
      <TableRegion label="Tabla de jugadores diarios">
        <table className={c.table} aria-describedby={noteId}>
          <caption className="sr-only">Jugadores diarios</caption>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} scope="col" className={c.th}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={columns.length} />
            ) : (
              pages.pageItems.map((row) => (
                <tr key={row.date}>
                  <th scope="row" className={cn(c.td, 'text-left font-normal')}>
                    {formatDay(row.date)}
                  </th>
                  <td className={c.td}>{formatCount(row.total)}</td>
                  {GAME_IDS.map((g) => (
                    <td key={g} className={c.td}>
                      {formatCount(row.games[g])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableRegion>
      <Pagination
        page={pages.page}
        totalPages={pages.totalPages}
        total={pages.total}
        pageSize={pages.pageSize}
        noun="días"
        onChange={pages.setPage}
        label="Paginado de jugadores diarios"
      />
      <p id={noteId} className="font-sans text-caption text-text-muted">
        {NOTES.daily}
      </p>
    </Panel>
  );
}
