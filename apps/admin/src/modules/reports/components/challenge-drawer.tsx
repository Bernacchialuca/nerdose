import { useEffect, useRef, useState } from 'react';

import { Alert, Badge, Banner, Panel } from '@nerdose/ui';

import { dangerButtonClass } from '@/components/danger-button';
import { Dialog } from '@/components/dialog';
import { formatInstant } from '@/lib/format-date';

import type { AdminChallenge, ReportGroup } from '../api/types';
import { CHALLENGE_STATUS_LABELS, GAME_LABELS, challengeLabel } from '../labels';

import { PayloadView } from './payload-view';
import { ReportItem } from './report-item';
import { VerificationLog } from './verification-log';

type ChallengeDrawerProps = {
  snapshot: ReportGroup;
  liveGroup: ReportGroup | undefined;
  onClose: () => void;
  onVoid: (challenge: AdminChallenge, trigger: HTMLElement) => void;
};

type ClosedMap = Record<string, 'resolved' | 'dismissed'>;

export function ChallengeDrawer({ snapshot, liveGroup, onClose, onVoid }: ChallengeDrawerProps) {
  const group = liveGroup ?? snapshot;
  const { challenge } = group;
  const [closed, setClosed] = useState<ClosedMap>({});
  const [notice, setNotice] = useState<'stale' | 'failed' | null>(null);
  const [pendingFocus, setPendingFocus] = useState<{ id: string } | null>(null);
  const resolveRefs = useRef(new Map<string, HTMLButtonElement>());
  const titleRef = useRef<HTMLHeadingElement>(null);

  const reports = snapshot.reports.map((r) => ({ ...r, status: closed[r.id] ?? r.status }));
  const voidable = challenge.status === 'published';

  useEffect(() => {
    if (pendingFocus === null) return;
    const target = resolveRefs.current.get(pendingFocus.id) ?? titleRef.current;
    target?.focus();
  }, [pendingFocus]);

  const onClosed = (id: string, status: 'resolved' | 'dismissed') => {
    const next = { ...closed, [id]: status };
    setClosed(next);
    setNotice(null);
    const open = snapshot.reports.filter((r) => (next[r.id] ?? r.status) === 'open');
    const index = snapshot.reports.findIndex((r) => r.id === id);
    const after = open.find((r) => snapshot.reports.indexOf(r) > index);
    setPendingFocus({ id: (after ?? open.at(0))?.id ?? 'title' });
  };

  const registerResolve = (id: string, el: HTMLButtonElement | null) => {
    if (el) resolveRefs.current.set(id, el);
    else resolveRefs.current.delete(id);
  };

  return (
    <Dialog
      variant="drawer"
      title={challengeLabel(challenge)}
      titleRef={titleRef}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{GAME_LABELS[challenge.game_id]}</Badge>
            <Badge>#{challenge.number}</Badge>
            <Badge>{challenge.date}</Badge>
            <Badge>{CHALLENGE_STATUS_LABELS[challenge.status]}</Badge>
            {group.alerted_at ? (
              <Badge tone="pending" strong>
                <span title={formatInstant(group.alerted_at)}>alertado</span>
              </Badge>
            ) : null}
          </div>
          {challenge.status === 'voided' && challenge.voided_at ? (
            <p className="font-sans text-body-sm text-text-body">
              Anulado el {formatInstant(challenge.voided_at)} · {challenge.void_reason}
            </p>
          ) : null}
          {notice === 'stale' ? (
            <div role="alert">
              <Banner
                variant="warning"
                announce={false}
                title="Este reporte ya estaba cerrado. Actualizamos la lista."
              />
            </div>
          ) : null}
          {notice === 'failed' ? (
            <Alert title="No pudimos actualizar el reporte. Probá de nuevo." />
          ) : null}
        </div>

        <PayloadView challenge={challenge} />
        <VerificationLog verification={challenge.verification} />

        <Panel title={`Reportes (${reports.length})`} titleLevel={3}>
          {reports.map((report) => (
            <ReportItem
              key={report.id}
              report={report}
              registerResolve={registerResolve}
              onClosed={onClosed}
              onStale={() => {
                setNotice('stale');
              }}
              onFailed={() => {
                setNotice('failed');
              }}
            />
          ))}
        </Panel>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {voidable ? null : (
            <p className="font-sans text-body-sm text-text-muted">
              Solo se anulan desafíos publicados.
            </p>
          )}
          <button
            type="button"
            aria-disabled={voidable ? undefined : true}
            onClick={(event) => {
              if (voidable) onVoid(challenge, event.currentTarget);
            }}
            className={dangerButtonClass({ disabled: !voidable })}
          >
            Anular desafío
          </button>
        </div>
      </div>
    </Dialog>
  );
}
