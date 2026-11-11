import { Panel } from '@nerdose/ui';

import { readVerification } from '../payload-view-model';

export function VerificationLog({ verification }: { verification: Record<string, unknown> }) {
  const view = readVerification(verification);
  return (
    <Panel title="Log de verificación" titleLevel={3}>
      {view.kind === 'log' ? (
        <>
          <p className="sr-only">
            {view.log.ok ? 'verificación correcta' : 'verificación fallida'}
          </p>
          <ul className="flex flex-col gap-1.5">
            {view.log.checks.map((check) => (
              <li key={check.name} className="font-mono text-mono-body text-text-body">
                <span aria-hidden="true">{check.ok ? '✓' : '✗'}</span>
                <span className="sr-only">{check.ok ? 'correcto: ' : 'fallido: '}</span>{' '}
                {check.name}
                {check.detail ? <span className="text-text-muted"> · {check.detail}</span> : null}
              </li>
            ))}
          </ul>
          {view.log.reason ? (
            <p className="font-sans text-body-sm text-text-muted">{view.log.reason}</p>
          ) : null}
        </>
      ) : (
        <dl className="flex flex-col gap-2">
          {view.rows.map((row) => (
            <div key={row.path} className="flex flex-wrap gap-x-3">
              <dt className="font-mono text-label-comment text-text-dim">{row.path}</dt>
              <dd className="font-mono text-mono-body text-text-body">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Panel>
  );
}
