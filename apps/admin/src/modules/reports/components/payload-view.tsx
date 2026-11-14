import { Panel } from '@nerdose/ui';

import { CULPRIT_KIND_LABELS } from '../labels';
import type { AdminChallenge } from '../api/types';
import { flattenPayload } from '../payload-view-model';

export function PayloadBilingual({ payload }: { payload: Record<string, unknown> }) {
  const { bilingual } = flattenPayload(payload);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {(['es', 'en'] as const).map((locale) => (
        <Panel key={locale} title={locale.toUpperCase()} titleLevel={3}>
          <dl className="flex flex-col gap-3">
            {bilingual.map((row) => (
              <div key={row.path} className="flex flex-col gap-0.5">
                <dt className="font-mono text-label-comment text-text-dim">{row.path}</dt>
                <dd className="font-sans text-body-sm text-text-body">{row[locale]}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      ))}
    </div>
  );
}

type PayloadCommonProps = {
  payload: Record<string, unknown>;
  /** Solo Reportes los conoce; sin ellos no se muestra la fila «Culpables posibles». */
  culprits?: AdminChallenge['culprits'];
};

export function PayloadCommon({ payload, culprits }: PayloadCommonProps) {
  const { common } = flattenPayload(payload);
  return (
    <Panel title="Datos del desafío" titleLevel={3}>
      <dl className="flex flex-col gap-3">
        {common.map((row) => (
          <div key={row.path} className="flex flex-wrap gap-x-3">
            <dt className="font-mono text-label-comment text-text-dim">{row.path}</dt>
            <dd className="min-w-0 break-words font-mono text-mono-body text-text-body">
              {row.value}
            </dd>
          </div>
        ))}
        {culprits === undefined ? null : (
          <div className="flex flex-wrap gap-x-3">
            <dt className="font-mono text-label-comment text-text-dim">Culpables posibles</dt>
            <dd className="font-mono text-mono-body text-text-body">
              {culprits.length === 0 ? (
                '—'
              ) : (
                <ul>
                  {culprits.map((c) => (
                    <li key={c.id}>
                      {CULPRIT_KIND_LABELS[c.kind]} · {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        )}
      </dl>
    </Panel>
  );
}

export function PayloadView({ challenge }: { challenge: AdminChallenge }) {
  return (
    <div className="flex flex-col gap-4">
      <PayloadBilingual payload={challenge.payload} />
      <PayloadCommon payload={challenge.payload} culprits={challenge.culprits} />
    </div>
  );
}
