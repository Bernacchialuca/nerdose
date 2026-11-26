import { Panel, cn, dataTableClass } from '@nerdose/ui';

import { formatCount } from '@/lib/format-number';

import { Pagination, usePagination } from '@/components/pagination';
import { TableRegion } from '@/components/table-region';

import type { RejectedGuess } from '../api/types';

export function TopRejectedPanel({ guesses }: { guesses: RejectedGuess[] }) {
  const c = dataTableClass();
  const pages = usePagination(guesses, 10);
  return (
    <Panel title="Top 50 de palabras rechazadas en Devdle">
      {guesses.length === 0 ? (
        <p className="font-sans text-body text-text-muted">
          <span aria-hidden="true">✓ </span>
          Sin rechazos: ningún jugador intentó una palabra que Devdle no acepte.
        </p>
      ) : (
        <TableRegion label="Tabla de palabras rechazadas">
          <table className={c.table}>
            <caption className="sr-only">
              Palabras rechazadas en Devdle por jugadores distintos
            </caption>
            <thead>
              <tr>
                {['#', 'Palabra', 'Jugadores distintos'].map((col) => (
                  <th key={col} scope="col" className={c.th}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.pageItems.map((g, i) => (
                <tr key={g.word}>
                  <td className={c.td}>{(pages.page - 1) * pages.pageSize + i + 1}</td>
                  <th scope="row" className={cn(c.td, 'text-left font-normal')}>
                    {g.word}
                  </th>
                  <td className={c.td}>{formatCount(g.distinct_players)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}
      <Pagination
        page={pages.page}
        totalPages={pages.totalPages}
        total={pages.total}
        pageSize={pages.pageSize}
        noun="palabras"
        onChange={pages.setPage}
        label="Paginado de palabras rechazadas"
      />
    </Panel>
  );
}
