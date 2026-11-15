import { useId, useState } from 'react';

import { Panel, cn, dataTableClass } from '@nerdose/ui';

import { TableRegion } from '@/components/table-region';
import { formatCount } from '@/lib/format-number';
import { CHALLENGE_STATUS_LABELS, GAME_LABELS } from '@/modules/reports';

import type { ChallengeQualityRow } from '../api/types';
import {
  DEFAULT_QUALITY_SORT,
  NOTES,
  QUALITY_COLUMNS,
  challengeCell,
  formatPercent,
  nextSort,
  sortQuality,
} from '../metrics-model';
import type { QualitySort } from '../metrics-model';
import { EmptyRow } from './empty-row';

export function QualityTable({ quality }: { quality: ChallengeQualityRow[] }) {
  const noteId = useId();
  const c = dataTableClass();
  const [sort, setSort] = useState<QualitySort>(DEFAULT_QUALITY_SORT);
  const rows = sortQuality(quality, sort);
  return (
    <Panel title="Calidad por desafío">
      <TableRegion label="Tabla de calidad por desafío">
        <table className={c.table} aria-describedby={noteId}>
          <caption className="sr-only">Calidad por desafío</caption>
          <thead>
            <tr>
              {QUALITY_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={c.th}
                  aria-sort={sort.key === col.key ? sort.dir : undefined}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSort(nextSort(sort, col.key));
                    }}
                    className="min-h-11 w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {col.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={QUALITY_COLUMNS.length} />
            ) : (
              rows.map((row) => (
                <tr key={row.challenge_id}>
                  <th scope="row" className={cn(c.td, 'text-left font-normal')}>
                    {challengeCell(row)}
                  </th>
                  <td className={c.td}>{GAME_LABELS[row.game_id]}</td>
                  <td className={c.td}>{formatCount(row.started)}</td>
                  <td className={c.td}>{formatCount(row.finished)}</td>
                  <td className={c.td}>{formatPercent(row.completion_rate)}</td>
                  <td className={c.td}>{formatPercent(row.win_rate)}</td>
                  <td className={c.td}>{formatCount(row.reports)}</td>
                  <td className={c.td}>{CHALLENGE_STATUS_LABELS[row.status]}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableRegion>
      <p id={noteId} className="font-sans text-caption text-text-muted">
        {NOTES.quality}
      </p>
    </Panel>
  );
}
