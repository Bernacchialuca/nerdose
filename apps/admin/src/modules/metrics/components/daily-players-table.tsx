import { useId } from 'react';

import { GAME_IDS } from '@nerdose/core';
import { Panel, cn, dataTableClass } from '@nerdose/ui';

import { TableRegion } from '@/components/table-region';
import { formatDay } from '@/lib/format-date';
import { formatCount } from '@/lib/format-number';
import { GAME_LABELS } from '@/modules/reports';

import type { DailyPlayersRow } from '../api/types';
import { NOTES, dailyRows } from '../metrics-model';
import { EmptyRow } from './empty-row';

type Props = { daily: DailyPlayersRow[]; from: string; to: string };

export function DailyPlayersTable({ daily, from, to }: Props) {
  const noteId = useId();
  const c = dataTableClass();
  const rows = dailyRows(daily, from, to);
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
              rows.map((row) => (
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
      <p id={noteId} className="font-sans text-caption text-text-muted">
        {NOTES.daily}
      </p>
    </Panel>
  );
}
