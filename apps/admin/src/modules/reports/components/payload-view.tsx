import { Panel } from '@nerdose/ui';

import { CULPRIT_KIND_LABELS } from '../labels';
import type { AdminChallenge } from '../api/types';
import { flattenPayload } from '../payload-view-model';

/** Los textos del desafío en español (el admin no muestra la versión en inglés). */
export function PayloadTexts({ payload }: { payload: Record<string, unknown> }) {
  const { bilingual } = flattenPayload(payload);
  if (bilingual.length === 0) return null;
  return (
    <Panel title="Textos" titleLevel={3}>
      <dl className="flex flex-col gap-3">
        {bilingual.map((row) => (
          <div key={row.path} className="flex flex-col gap-0.5">
            <dt className="font-mono text-label-comment text-text-dim">{row.path}</dt>
            <dd className="font-sans text-body-sm text-text-body">{row.es}</dd>
          </div>
        ))}
      </dl>
    </Panel>
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
      <PayloadTexts payload={challenge.payload} />
      <PayloadCommon payload={challenge.payload} culprits={challenge.culprits} />
    </div>
  );
}
