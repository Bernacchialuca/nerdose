import { useId } from 'react';

import { Badge, buttonClass, linkClass } from '@nerdose/ui';

import { isApiError } from '@/lib/api-errors';
import { formatRelative } from '@/lib/format-date';

import { useUpdateReport } from '../api/use-update-report';
import type { AdminReport } from '../api/types';
import { NO_PLAY_LABEL, PLAY_STATUS_LABELS, REASON_LABELS, REPORT_STATUS_LABELS } from '../labels';

type ReportItemProps = {
  report: AdminReport;
  registerResolve: (id: string, el: HTMLButtonElement | null) => void;
  onClosed: (id: string, status: 'resolved' | 'dismissed') => void;
  onStale: () => void;
  onFailed: () => void;
};

export function ReportItem({
  report,
  registerResolve,
  onClosed,
  onStale,
  onFailed,
}: ReportItemProps) {
  const headingId = useId();
  const update = useUpdateReport();
  const pendingStatus = update.isPending ? update.variables.status : null;

  const act = (status: 'resolved' | 'dismissed') => {
    if (update.isPending) return;
    update.mutate(
      { report_id: report.id, status },
      {
        onSuccess: () => {
          onClosed(report.id, status);
        },
        onError: (error) => {
          if (isApiError(error, 'report_not_open') || isApiError(error, 'not_found')) onStale();
          else if (!(isApiError(error) && error.status === 401)) onFailed();
        },
      },
    );
  };

  const { context } = report;
  const playLabel = context.play_status
    ? (PLAY_STATUS_LABELS[context.play_status] ?? context.play_status)
    : NO_PLAY_LABEL;
  const busy = pendingStatus !== null;

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-2 rounded-tile border border-border-row p-4"
    >
      <h3 id={headingId} className="font-mono text-mono-strong text-text">
        {REASON_LABELS[report.reason]}
      </h3>
      <p className="font-mono text-meta text-text-dim">
        {report.locale} · {formatRelative(report.created_at)} · jugador {report.player_ref}
      </p>
      <p className="whitespace-pre-wrap break-words font-sans text-body-sm text-text-body">
        {report.message ? `«${report.message}»` : '(sin mensaje)'}
      </p>
      <p className="flex min-w-0 flex-wrap gap-x-2 font-mono text-meta text-text-muted">
        <span>{playLabel}</span>
        {context.code_language ? <span>· lenguaje: {context.code_language}</span> : null}
        {context.user_agent ? (
          <span className="min-w-0 max-w-full truncate" title={context.user_agent}>
            · {context.user_agent}
          </span>
        ) : null}
      </p>
      {context.play_state != null ? (
        <details>
          <summary className="cursor-pointer font-mono text-meta text-text-muted">
            Estado de la partida
          </summary>
          <pre className="overflow-x-auto font-mono text-meta text-text-body">
            {JSON.stringify(context.play_state, null, 2)}
          </pre>
        </details>
      ) : null}
      {report.status === 'open' ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            ref={(el) => {
              registerResolve(report.id, el);
            }}
            type="button"
            aria-disabled={busy || undefined}
            onClick={() => {
              act('resolved');
            }}
            className={buttonClass({ variant: 'secondary', disabled: busy })}
          >
            {pendingStatus === 'resolved' ? 'Resolviendo…' : 'Resolver'}
          </button>
          <button
            type="button"
            aria-disabled={busy || undefined}
            onClick={() => {
              act('dismissed');
            }}
            className={linkClass({ tone: 'subtle' })}
          >
            {pendingStatus === 'dismissed' ? 'Descartando…' : 'Descartar'}
          </button>
        </div>
      ) : (
        <div>
          <Badge tone={report.status === 'resolved' ? 'success' : 'neutral'}>
            {REPORT_STATUS_LABELS[report.status]}
          </Badge>
        </div>
      )}
    </article>
  );
}
