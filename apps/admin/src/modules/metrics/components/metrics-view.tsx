import { useId, useState } from 'react';

import { today } from '@nerdose/core';

import { isApiError } from '@/lib/api-errors';

import { useMetrics } from '../api/use-metrics';
import { rangeCheck } from '../range';
import type { MetricsRange } from '../range';
import { LoadingNotice, RangeAlert, SystemAlert } from './metrics-alerts';
import { MetricsContent } from './metrics-content';
import { RangeForm } from './range-form';

type Props = { urlRange: MetricsRange; onSubmit: (range: MetricsRange) => void };

export function MetricsView({ urlRange, onSubmit }: Props) {
  const alertId = useId();
  const [draft, setDraft] = useState(urlRange);
  const todayUtc = today(new Date());
  const urlProblem = rangeCheck(urlRange.from, urlRange.to, todayUtc);
  const draftProblem = rangeCheck(draft.from, draft.to, todayUtc);
  const query = useMetrics(urlProblem ? null : urlRange);
  const busy = query.isFetching;

  const submit = () => {
    if (draftProblem || busy) return;
    if (draft.from === urlRange.from && draft.to === urlRange.to) void query.refetch();
    else onSubmit(draft);
  };

  let notice = null;
  let content = null;
  if (draftProblem) {
    notice = <RangeAlert id={alertId} message={draftProblem.message} />;
  } else if (urlProblem) {
    notice = null;
  } else if (query.isFetching && !query.data) {
    notice = <LoadingNotice />;
  } else if (query.isError) {
    const error = query.error;
    notice = isApiError(error, 'validation_error') ? (
      <RangeAlert id={alertId} message={error.message} />
    ) : (
      <SystemAlert
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  } else if (query.data) {
    content = <MetricsContent data={query.data} range={urlRange} />;
  }

  return (
    <>
      <RangeForm
        draft={draft}
        onChange={setDraft}
        problem={draftProblem}
        alertId={alertId}
        busy={busy}
        onSubmit={submit}
      />
      {notice}
      {content}
    </>
  );
}
