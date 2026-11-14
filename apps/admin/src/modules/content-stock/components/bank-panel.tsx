import { Panel, cn, dataTableClass } from '@nerdose/ui';

import { formatCount } from '@/lib/format-number';
import { GAME_LABELS } from '@/modules/reports';

import type { BankStock } from '../api/types';
import { BANK_LABELS, windowLabel } from '../stock-model';
import { CycleStatus } from './cycle-status';
import { StatList } from './stat-list';
import { TableRegion } from './table-region';

const COLUMNS = [
  'Juego',
  'Ventana',
  'Por desafío',
  'Disponibles',
  'Días de stock',
  'Alcanza para ciclar',
];

export function BankPanel({ bank }: { bank: BankStock }) {
  const labels = BANK_LABELS[bank.bank];
  const c = dataTableClass();
  return (
    <Panel title={labels.title}>
      <StatList
        pairs={[
          { label: 'Aprobados disponibles', value: formatCount(bank.approved_available) },
          { label: 'Aprobados totales', value: formatCount(bank.approved_total) },
          { label: 'Rechazados', value: formatCount(bank.rejected_total) },
          { label: 'Días de stock', value: formatCount(bank.days_of_stock) },
          { label: 'Alcanza para ciclar', value: <CycleStatus ok={bank.cycle_ok} /> },
        ]}
      />
      <TableRegion label={`Tabla de ${labels.noun} por juego`}>
        <table className={cn(c.table, 'min-w-0')}>
          <caption className="sr-only">{labels.short} por juego consumidor</caption>
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
            {bank.consumers.map((consumer) => (
              <tr key={consumer.game_id}>
                <th scope="row" className={cn(c.td, 'text-left font-normal')}>
                  {GAME_LABELS[consumer.game_id]}
                </th>
                <td className={c.td}>{windowLabel(consumer.window_days)}</td>
                <td className={c.td}>{formatCount(consumer.items_per_challenge)}</td>
                <td className={c.td}>{formatCount(consumer.approved_available)}</td>
                <td className={c.td}>{formatCount(consumer.days_of_stock)}</td>
                <td className={c.td}>
                  <CycleStatus ok={consumer.cycle_ok} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableRegion>
    </Panel>
  );
}
