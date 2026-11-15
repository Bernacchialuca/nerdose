import { useId } from 'react';

import { Panel, cn, dataTableClass } from '@nerdose/ui';

import { TableRegion } from '@/components/table-region';
import { formatDay } from '@/lib/format-date';
import { formatCount } from '@/lib/format-number';

import type { RetentionRow } from '../api/types';
import { NOTES, formatPercent, retentionRows } from '../metrics-model';
import { EmptyRow } from './empty-row';

const COLUMNS = ['Cohorte (primer día)', 'Jugadores', 'D1', 'D7'];

export function RetentionTable({
  retention,
  className,
}: {
  retention: RetentionRow[];
  className?: string;
}) {
  const noteId = useId();
  const c = dataTableClass();
  const rows = retentionRows(retention);
  return (
    <Panel title="Retención por cohorte" className={className}>
      <TableRegion label="Tabla de retención por cohorte">
        <table className={cn(c.table, 'min-w-0')} aria-describedby={noteId}>
          <caption className="sr-only">Retención por cohorte</caption>
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
            {rows.length === 0 ? (
              <EmptyRow colSpan={COLUMNS.length} />
            ) : (
              rows.map((row) => (
                <tr key={row.cohort_date}>
                  <th scope="row" className={cn(c.td, 'text-left font-normal')}>
                    {formatDay(row.cohort_date)}
                  </th>
                  <td className={c.td}>{formatCount(row.cohort_size)}</td>
                  <td className={c.td}>{formatPercent(row.d1)}</td>
                  <td className={c.td}>{formatPercent(row.d7)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableRegion>
      <p id={noteId} className="font-sans text-caption text-text-muted">
        {NOTES.retention}
      </p>
    </Panel>
  );
}
