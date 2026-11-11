import { Badge, buttonClass } from '@nerdose/ui';

import { formatInstant, formatRelative } from '@/lib/format-date';

import type { AdminChallenge, ReportGroup } from '../api/types';
import { CHALLENGE_STATUS_LABELS, challengeLabel, reasonsSummary } from '../labels';

const COLUMNS = [
  'Alerta',
  'Desafío',
  'Fecha',
  'Reportes',
  'Motivos',
  'Último reporte',
  'Estado del desafío',
  'Acción',
] as const;

const TH =
  'border-b border-border-subtle px-5 py-3.5 text-left font-mono text-label-comment font-medium text-text-dim';
const TD = 'border-b border-border-row px-5 py-3.5 align-middle';

type ReportGroupsTableProps = {
  groups: ReportGroup[];
  onOpen: (group: ReportGroup, trigger: HTMLElement) => void;
  onVoid: (challenge: AdminChallenge, trigger: HTMLElement) => void;
};

function lastReportAt(group: ReportGroup): string | null {
  return group.reports.reduce<string | null>(
    (latest, r) => (latest === null || r.created_at > latest ? r.created_at : latest),
    null,
  );
}

export function ReportGroupsTable({ groups, onOpen, onVoid }: ReportGroupsTableProps) {
  return (
    <div
      role="region"
      // Región con scroll horizontal: debe ser alcanzable con teclado (WCAG 2.1.1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label="Tabla de grupos de reportes"
      className="overflow-x-auto rounded-panel border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <table className="w-full font-mono text-mono-body text-text-body">
        <caption className="sr-only">Grupos de reportes</caption>
        <thead>
          <tr>
            {COLUMNS.map((name) => (
              <th key={name} scope="col" className={TH}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const { challenge } = group;
            const last = lastReportAt(group);
            const name = challengeLabel(challenge);
            return (
              <tr key={challenge.id} className="relative hover:bg-surface-2">
                <td className={TD}>
                  {group.alerted_at ? (
                    <Badge tone="pending" strong>
                      <span title={formatInstant(group.alerted_at)}>alertado</span>
                    </Badge>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={TD}>
                  <button
                    type="button"
                    onClick={(event) => {
                      onOpen(group, event.currentTarget);
                    }}
                    className="text-left font-bold text-text after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {name}
                  </button>
                </td>
                <td className={TD}>{challenge.date}</td>
                <td className={TD}>{group.report_count}</td>
                <td className={TD}>{reasonsSummary(group.reasons)}</td>
                <td className={TD}>{last ? formatRelative(last) : '—'}</td>
                <td className={TD}>{CHALLENGE_STATUS_LABELS[challenge.status]}</td>
                <td className={TD}>
                  {challenge.status === 'published' ? (
                    <button
                      type="button"
                      aria-label={`Anular ${name}`}
                      onClick={(event) => {
                        onVoid(challenge, event.currentTarget);
                      }}
                      className={`${buttonClass({ variant: 'secondary' })} relative z-10`}
                    >
                      Anular
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
