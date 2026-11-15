import { useId } from 'react';

import { Panel, cn, dataTableClass } from '@nerdose/ui';

import { TableRegion } from '@/components/table-region';
import { formatCount } from '@/lib/format-number';

import type { StreakBucketRow } from '../api/types';
import { NOTES, streakRows } from '../metrics-model';

const COLUMNS = ['Tramo de racha', 'Jugadores', '% del total'];

export function StreakTable({
  distribution,
  className,
}: {
  distribution: StreakBucketRow[];
  className?: string;
}) {
  const noteId = useId();
  const c = dataTableClass();
  return (
    <Panel title="Distribución de rachas" className={className}>
      <TableRegion label="Tabla de distribución de rachas">
        <table className={cn(c.table, 'min-w-0')} aria-describedby={noteId}>
          <caption className="sr-only">Distribución de rachas</caption>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col} scope="col" className={c.th}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {streakRows(distribution).map((row) => (
              <tr key={row.label}>
                <th scope="row" className={cn(c.td, 'text-left font-normal')}>
                  {row.label}
                </th>
                <td className={c.td}>{formatCount(row.players)}</td>
                <td className={c.td}>{row.share}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableRegion>
      <p id={noteId} className="font-sans text-caption text-text-muted">
        {NOTES.streaks}
      </p>
    </Panel>
  );
}
