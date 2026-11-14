import { Panel, cn, dataTableClass } from '@nerdose/ui';

import type { RejectionRow } from '../stock-model';
import { TableRegion } from './table-region';

export function BankRejectionsPanel({ rows }: { rows: RejectionRow[] }) {
  const c = dataTableClass();
  return (
    <Panel title="Ítems rechazados">
      {rows.length === 0 ? (
        <p className="font-sans text-body text-text-muted">Ningún ítem rechazado</p>
      ) : (
        <TableRegion label="Tabla de ítems rechazados">
          <table className={c.table}>
            <caption className="sr-only">Ítems rechazados de los bancos</caption>
            <thead>
              <tr>
                {['Banco', 'Ítem', 'Motivo'].map((col) => (
                  <th key={col} scope="col" className={c.th}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className={c.td}>{row.bank}</td>
                  <th scope="row" className={cn(c.td, 'text-left font-normal')}>
                    {row.label}
                  </th>
                  <td className={c.td}>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}
    </Panel>
  );
}
