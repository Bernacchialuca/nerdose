import { Link } from 'react-router';

import type { BankName } from '@nerdose/core';
import { Panel, linkClass } from '@nerdose/ui';

import { formatCount } from '@/lib/format-number';

import type { BankStock } from '../api/types';

const BANK_LABEL: Record<BankName, string> = { terms: 'Términos', timeline_facts: 'Hechos' };

/**
 * Resumen de rechazados por banco con acceso al listado. La lista completa vive en «Bancos»
 * (con buscador y paginado): acá llegaba a cientos de filas seguidas.
 */
export function BankRejectionsLink({ banks }: { banks: BankStock[] }) {
  return (
    <Panel title="Ítems rechazados">
      <ul className="flex flex-col gap-2">
        {banks.map((bank) => (
          <li key={bank.bank} className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="font-mono text-mono-body text-text-body">
              {BANK_LABEL[bank.bank]}: {formatCount(bank.rejected_total)} rechazados
            </span>
            {bank.rejected_total > 0 ? (
              <Link to={`/banks?bank=${bank.bank}&status=rejected`} className={linkClass()}>
                Ver en Bancos <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
