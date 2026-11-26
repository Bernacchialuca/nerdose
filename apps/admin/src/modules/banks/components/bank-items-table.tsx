import type { BankName, GameId } from '@nerdose/core';
import { Badge, cn, dataTableClass } from '@nerdose/ui';

import { TableRegion } from '@/components/table-region';
import { formatDay } from '@/lib/format-date';
import { formatCount } from '@/lib/format-number';
import { GAME_LABELS } from '@/modules/reports';

import type { BankItem } from '../api/types';
import { categoryLabel, reasonLabel } from '../labels';

const lastUsed = (item: BankItem) =>
  (Object.entries(item.last_used) as [GameId, string | null][]).map(([game, day]) => (
    <li key={game} className="whitespace-nowrap">
      <span className="text-text-dim">{GAME_LABELS[game]}:</span> {day ? formatDay(day) : 'nunca'}
    </li>
  ));

export function BankItemsTable({ bank, items }: { bank: BankName; items: BankItem[] }) {
  const c = dataTableClass();
  const isTerms = bank === 'terms';
  const columns = [
    isTerms ? 'Término' : 'Hecho',
    'Categoría',
    ...(isTerms ? [] : ['Fecha']),
    'Estado',
    'Último uso',
    'Sitelinks',
  ];
  return (
    <TableRegion label={isTerms ? 'Tabla de términos' : 'Tabla de hechos'}>
      <table className={c.table}>
        <caption className="sr-only">{isTerms ? 'Términos del banco' : 'Hechos del banco'}</caption>
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
          {items.map((item) => (
            <tr key={item.id}>
              <th scope="row" className={cn(c.td, 'max-w-md text-left font-normal')}>
                <span className="flex flex-col gap-1">
                  <span className="font-mono text-mono-strong text-text">{item.label}</span>
                  {item.description ? (
                    <span className="font-sans text-caption text-text-muted">
                      {item.description}
                    </span>
                  ) : null}
                  {item.excluded_from.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {item.excluded_from.map((game) => (
                        <Badge key={game} tone="pending">
                          fuera de {GAME_LABELS[game]}
                        </Badge>
                      ))}
                    </span>
                  ) : null}
                </span>
              </th>
              <td className={c.td}>{categoryLabel(bank, item.category)}</td>
              {isTerms ? null : (
                <td className={cn(c.td, 'whitespace-nowrap')}>
                  {item.event_date ? formatDay(item.event_date) : '—'}
                </td>
              )}
              <td className={c.td}>
                <span className="flex flex-col items-start gap-1">
                  <Badge tone={item.status === 'approved' ? 'success' : 'neutral'}>
                    {item.status === 'approved' ? 'aprobado' : 'rechazado'}
                  </Badge>
                  {item.rejection_reason ? (
                    <span className="font-sans text-caption text-text-muted">
                      {reasonLabel(item.rejection_reason)}
                    </span>
                  ) : null}
                </span>
              </td>
              <td className={c.td}>
                <ul className="flex flex-col gap-0.5 font-mono text-meta">{lastUsed(item)}</ul>
              </td>
              <td className={c.td}>{formatCount(item.sitelinks)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableRegion>
  );
}
