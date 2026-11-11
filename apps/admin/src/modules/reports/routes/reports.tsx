import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import { Alert, Panel } from '@nerdose/ui';

import { Tabs } from '@/components/tabs';
import { usePageTitle } from '@/hooks/use-page-title';

import { useReportGroups } from '../api/use-report-groups';
import type { AdminChallenge, ReportGroup } from '../api/types';
import { ChallengeDrawer } from '../components/challenge-drawer';
import { ReportGroupsTable } from '../components/report-groups-table';
import { VoidChallengeDialog } from '../components/void-challenge-dialog';
import { VoidNotice } from '../components/void-notice';
import type { VoidNoticeData } from '../components/void-notice';
import { STATUS_TABS, parseStatusParam } from '../labels';

export function Component() {
  const headingRef = usePageTitle('Reportes · Admin · nerdose');
  const [params, setParams] = useSearchParams();
  const status = parseStatusParam(params.get('status'));
  const query = useReportGroups(status);
  const [notice, setNotice] = useState<VoidNoticeData | null>(null);
  const [selected, setSelected] = useState<ReportGroup | null>(null);
  const [voidTarget, setVoidTarget] = useState<AdminChallenge | null>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);

  const changeStatus = (value: typeof status) => {
    setNotice(null);
    setParams(value === 'open' ? {} : { status: value }, { replace: true });
  };

  const groups = query.data?.groups;
  const tab = STATUS_TABS.find((t) => t.value === status);
  const liveGroup = selected
    ? groups?.find((g) => g.challenge.id === selected.challenge.id)
    : undefined;

  let content;
  if (query.isPending) {
    content = <p role="status">Cargando reportes…</p>;
  } else if (query.isError) {
    content = (
      <Alert
        title="No pudimos cargar los reportes. Probá de nuevo."
        action={
          <button
            type="button"
            onClick={() => {
              void query.refetch();
            }}
            className="inline-flex min-h-11 items-center rounded-control border border-border-strong px-4 font-mono text-button-md font-medium text-text hover:border-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Reintentar
          </button>
        }
      />
    );
  } else if (groups?.length === 0) {
    content = (
      <p className="font-sans text-body text-text-muted">
        <span aria-hidden="true">✓ </span>
        {tab?.empty}
      </p>
    );
  } else if (groups) {
    content = (
      <ReportGroupsTable
        groups={groups}
        onOpen={(group) => {
          setSelected(group);
        }}
        onVoid={(challenge) => {
          setVoidTarget(challenge);
        }}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 ref={headingRef} tabIndex={-1} className="font-mono text-title-page text-text">
          Reportes
        </h1>
        <p className="font-sans text-body-sm text-text-muted">
          Agrupados por desafío · alertados primero, después los más reportados y los más recientes
        </p>
      </div>
      {notice ? (
        <VoidNotice
          ref={noticeRef}
          notice={notice}
          onDismiss={() => {
            setNotice(null);
          }}
        />
      ) : null}
      <Panel title="Grupos de reportes">
        <Tabs
          label="Estado de los reportes"
          tabs={STATUS_TABS}
          value={status}
          onChange={changeStatus}
        >
          {content}
        </Tabs>
      </Panel>
      {selected ? (
        <ChallengeDrawer
          snapshot={selected}
          liveGroup={liveGroup}
          onClose={() => {
            setSelected(null);
          }}
          onVoid={(challenge) => {
            setVoidTarget(challenge);
          }}
        />
      ) : null}
      {voidTarget ? (
        <VoidChallengeDialog
          challenge={voidTarget}
          onClose={() => {
            setVoidTarget(null);
          }}
          onGone={() => {
            setVoidTarget(null);
            setSelected(null);
          }}
          onVoided={(result) => {
            setVoidTarget(null);
            setSelected(null);
            setNotice(result);
          }}
        />
      ) : null}
    </>
  );
}
