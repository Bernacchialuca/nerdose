import { Panel } from '@nerdose/ui';

import { formatInstantUtc } from '@/lib/format-date';
import { formatCount } from '@/lib/format-number';

import type { LastSync } from '../api/types';
import { StatList } from './stat-list';

export function LastSyncPanel({ lastSync }: { lastSync: LastSync | null }) {
  return (
    <Panel title="Última carga del dataset">
      {lastSync === null ? (
        <p className="font-sans text-body text-text-muted">
          Sin datos de carga: el dataset todavía no se cargó.
        </p>
      ) : (
        <StatList
          pairs={[
            { label: 'Fecha', value: formatInstantUtc(lastSync.finished_at) },
            { label: 'Versión', value: lastSync.dataset_version },
            { label: 'Insertados', value: formatCount(lastSync.inserted) },
            { label: 'Actualizados', value: formatCount(lastSync.updated) },
            { label: 'Sin cambios', value: formatCount(lastSync.unchanged) },
            { label: 'Rechazados conservados', value: formatCount(lastSync.kept_rejected) },
          ]}
        />
      )}
    </Panel>
  );
}
